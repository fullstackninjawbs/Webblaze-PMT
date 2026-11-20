import { Types } from 'mongoose';
import { DailyStatus, IDailyStatus, IDailyStatusEntry } from './dailyStatus.model';
import { User } from '../users/user.model';
import { Task } from '../tasks/task.model';
import { TimeLog } from '../timelogs/timeLog.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';
import { RequestUser, getUserId } from '../../utils/access';
import { dayBounds, dayKey } from '../../utils/appTime';

const populateOptions = [
  { path: 'user', select: 'name email avatarUrl role department' },
  { path: 'project', select: 'name' },
  { path: 'entries.task', select: 'title status estimatedHours spentHours' },
  { path: 'entries.project', select: 'name' },
];

const roundHours = (hours: number) => Number(hours.toFixed(4));


/**
 * Seconds a user logged on each task during one calendar day.
 * Running timers count up to now, so an EOD submitted mid-timer is still accurate.
 */
export const getDailyTaskSeconds = async (userId: string, date: Date): Promise<Map<string, number>> => {
  const { start, end } = dayBounds(date);
  const logs = await TimeLog.find({ user: userId, startTime: { $gte: start, $lte: end } })
    .select('task startTime endTime durationSeconds');

  const now = Date.now();
  const perTask = new Map<string, number>();
  for (const log of logs) {
    const seconds = log.endTime
      ? log.durationSeconds || 0
      : Math.max(0, Math.floor((now - log.startTime.getTime()) / 1000));
    if (seconds <= 0) continue;
    const key = String(log.task);
    perTask.set(key, (perTask.get(key) || 0) + seconds);
  }
  return perTask;
};

/**
 * Builds structured entries for a report. Task-linked entries are resolved and their
 * hours are taken from the user's time logs for that day; clients cannot set hours.
 */
const buildEntries = async (
  userId: string,
  date: Date,
  rawEntries: { task?: string | null; title: string }[] = []
): Promise<{ entries: IDailyStatusEntry[]; totalHours: number }> => {
  const taskSeconds = await getDailyTaskSeconds(userId, date);

  const taskIds = rawEntries.map((e) => e.task).filter((id): id is string => !!id && Types.ObjectId.isValid(id));
  const tasks = taskIds.length
    ? await Task.find({ _id: { $in: taskIds } })
        .select('title status milestone assignedTo spentHours')
        .populate({ path: 'milestone', select: 'project', populate: { path: 'project', select: 'name' } })
    : [];
  const taskMap = new Map(tasks.map((t) => [String(t._id), t as any]));

  const seenTasks = new Set<string>();
  const entries: IDailyStatusEntry[] = [];

  for (const raw of rawEntries) {
    const title = raw.title.trim();
    if (!title) continue;

    const candidate = raw.task ? taskMap.get(String(raw.task)) : undefined;
    // A line links to a task only if it is the user's task or they logged time on it that
    // day. Otherwise posting any task id would reveal its title, status and project.
    const task =
      candidate && (String(candidate.assignedTo) === String(userId) || taskSeconds.has(String(candidate._id)))
        ? candidate
        : undefined;
    if (!task) {
      entries.push({ title });
      continue;
    }

    const id = String(task._id);
    // A task's hours are counted once even if it appears on several lines
    const hours = seenTasks.has(id) ? 0 : roundHours((taskSeconds.get(id) || 0) / 3600);
    seenTasks.add(id);

    const project = task.milestone?.project;
    entries.push({
      task: task._id,
      title,
      project: project?._id,
      projectName: project?.name,
      taskStatus: task.status,
      hours,
      totalHours: roundHours(task.spentHours || 0),
    });
  }

  const totalSeconds = Array.from(taskSeconds.values()).reduce((sum, s) => sum + s, 0);
  return { entries, totalHours: roundHours(totalSeconds / 3600) };
};

type RawEntry = { task?: string | null; title: string };

/** Turns a stored report into raw entries; legacy reports only have workDone text. */
const toRawEntries = (report: IDailyStatus): RawEntry[] => {
  if (report.entries && report.entries.length > 0) {
    return report.entries.map((e) => ({ task: e.task ? String(e.task) : null, title: e.title }));
  }
  return (report.workDone || '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)
    .map((title) => ({ title }));
};

/**
 * Merges entry lists. A task appears once (the later text wins); identical free-text
 * lines appear once. Order is preserved, with new lines appended.
 */
export const mergeRawEntries = (...lists: RawEntry[][]): RawEntry[] => {
  const merged: RawEntry[] = [];
  const taskIndex = new Map<string, number>();
  const seenText = new Set<string>();

  for (const list of lists) {
    for (const entry of list) {
      const title = entry.title.trim();
      if (!title) continue;
      if (entry.task) {
        const key = String(entry.task);
        const existing = taskIndex.get(key);
        if (existing !== undefined) {
          merged[existing] = { task: key, title };
        } else {
          taskIndex.set(key, merged.length);
          merged.push({ task: key, title });
        }
      } else {
        const key = title.toLowerCase();
        if (seenText.has(key)) continue;
        seenText.add(key);
        merged.push({ title });
      }
    }
  }
  return merged;
};

const deriveProject = (entries: IDailyStatusEntry[], fallback?: any) => {
  if (fallback) return fallback;
  const projectIds = new Set(entries.filter((e) => e.project).map((e) => String(e.project)));
  return projectIds.size === 1 ? entries.find((e) => e.project)!.project : undefined;
};

/** Writes one report from merged entries, recomputing hours from the day's time logs. */
const applyEntries = async (
  report: IDailyStatus,
  userId: string,
  date: Date,
  rawEntries: RawEntry[],
  extras: { plannedWork?: string; blockers?: string; conclusion?: string; project?: any } = {}
) => {
  const { entries, totalHours } = await buildEntries(userId, date, rawEntries);
  report.entries = entries;
  report.totalHours = totalHours;
  report.workDone = entries.map((e) => `- ${e.title}`).join('\n') || report.workDone;
  report.project = deriveProject(entries, extras.project ?? report.project);
  if (extras.plannedWork) report.plannedWork = extras.plannedWork;
  if (extras.blockers) report.blockers = extras.blockers;
  // The latest conclusion of the day replaces the earlier one
  if (extras.conclusion) report.conclusion = extras.conclusion;
  await report.save();
  return report;
};

/**
 * One report per user per calendar day. Submitting again on the same day updates that
 * day's report: new lines are added, task lines are refreshed with today's hours.
 * Returns whether an existing report was updated.
 */
export const createDailyStatus = async (
  data: Partial<IDailyStatus> & { entries?: RawEntry[] },
  isRetry = false
): Promise<{ status: IDailyStatus; updated: boolean }> => {
  const userId = String(data.user);
  // Reports are always for today: the client cannot backdate or forward-date them
  const date = new Date();
  const key = dayKey(date);
  const { start, end } = dayBounds(date);

  const incoming: RawEntry[] =
    data.entries && data.entries.length > 0
      ? data.entries
      : (data.workDone || '').split('\n').map((l) => ({ title: l.replace(/^\s*[-•*]\s*/, '').trim() }));

  // Older reports have no dayKey, so they are also matched by their date range
  const existing = await DailyStatus.findOne({
    user: userId,
    $or: [{ dayKey: key }, { date: { $gte: start, $lte: end } }],
  }).sort({ createdAt: 1 });

  if (existing) {
    const merged = mergeRawEntries(toRawEntries(existing), incoming);
    if (!existing.dayKey) existing.dayKey = key;
    await applyEntries(existing, userId, existing.date, merged, data);
    return { status: await existing.populate(populateOptions), updated: true };
  }

  const report = new DailyStatus({
    user: userId,
    date,
    dayKey: key,
    workDone: data.workDone,
    plannedWork: data.plannedWork,
    blockers: data.blockers,
  });
  try {
    await applyEntries(report, userId, date, mergeRawEntries(incoming), data);
  } catch (error: any) {
    // A simultaneous submit created today's report first: merge into it instead
    if (error?.code === 11000 && !isRetry) return createDailyStatus(data, true);
    throw error;
  }
  return { status: await report.populate(populateOptions), updated: false };
};

/**
 * Collapses duplicate reports (same user, same day) left from before the
 * one-per-day rule into the earliest report of that day.
 */
export const mergeDuplicateDailyStatuses = async (): Promise<number> => {
  const all = await DailyStatus.find().sort({ createdAt: 1 });
  const groups = new Map<string, IDailyStatus[]>();
  for (const report of all) {
    const key = `${report.user}-${dayKey(new Date(report.date))}`;
    groups.set(key, [...(groups.get(key) || []), report]);
  }

  let removed = 0;
  for (const reports of groups.values()) {
    if (reports.length < 2) continue;
    const [keep, ...rest] = reports;
    const merged = mergeRawEntries(...reports.map(toRawEntries));
    // Delete the duplicates first so giving the kept report its day key cannot collide
    await DailyStatus.deleteMany({ _id: { $in: rest.map((r) => r._id) } });
    keep.dayKey = dayKey(new Date(keep.date));
    await applyEntries(keep, String(keep.user), keep.date, merged, {
      plannedWork: rest.map((r) => r.plannedWork).filter(Boolean).pop(),
      blockers: rest.map((r) => r.blockers).filter(Boolean).pop(),
    });
    removed += rest.length;
  }
  return removed;
};

export const getMyDailyStatuses = async (userId: string): Promise<IDailyStatus[]> => {
  return DailyStatus.find({ user: userId })
    .populate(populateOptions)
    .sort({ date: -1, createdAt: -1 });
};

/**
 * Team view:
 *  - Admin / PM see everyone
 *  - Team Lead sees their own department only
 */
export const getTeamDailyStatuses = async (user: RequestUser): Promise<IDailyStatus[]> => {
  const query: any = {};

  if (user.role === Role.TEAM_LEAD) {
    if (user.department) {
      const regexes = normalizeDept(user.department).map((d) => new RegExp(d, 'i'));
      const deptUsers = await User.find({
        $or: [{ department: { $in: regexes } }, { department: user.department }],
      }).select('_id');
      query.user = { $in: deptUsers.map((u) => u._id) };
    } else {
      query.user = getUserId(user);
    }
  } else if (user.role !== Role.ADMIN && user.role !== Role.PM) {
    throw new ApiError(403, 'You do not have permission to view team status logs');
  }

  return DailyStatus.find(query)
    .populate(populateOptions)
    .sort({ date: -1, createdAt: -1 });
};
