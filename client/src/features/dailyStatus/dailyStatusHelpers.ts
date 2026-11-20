import { DailyStatus, DailyStatusEntry } from './dailyStatus.slice';

export interface NormalizedEntry {
  taskId?: string;
  title: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  hours: number;
  /** Total logged on the task: snapshot from submit time, else the task's current total. */
  totalHours?: number;
}

const idOf = (v: any): string | undefined => (v ? String(typeof v === 'object' ? v._id : v) : undefined);

/**
 * Structured entries for a report. Reports submitted before entries existed only have
 * the free-text `workDone`, so each of its lines becomes a free-text entry.
 */
export const getEntries = (log: DailyStatus): NormalizedEntry[] => {
  if (log.entries && log.entries.length > 0) {
    return log.entries.map((e: DailyStatusEntry) => ({
      taskId: idOf(e.task),
      title: e.title,
      projectId: idOf(e.project),
      projectName: e.projectName || (typeof e.project === 'object' ? e.project?.name : undefined),
      status: e.taskStatus || (typeof e.task === 'object' ? e.task?.status : undefined),
      hours: e.hours || 0,
      totalHours: e.totalHours ?? (typeof e.task === 'object' ? e.task?.spentHours : undefined),
    }));
  }

  return (log.workDone || '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)
    .map((title) => ({ title, hours: 0 }));
};

export const getTaskEntries = (log: DailyStatus) => getEntries(log).filter((e) => e.taskId);
export const getNoteEntries = (log: DailyStatus) => getEntries(log).filter((e) => !e.taskId);

/** Distinct project names mentioned by a report, from its task lines and its project field. */
export const getProjectNames = (log: DailyStatus): string[] => {
  const names = new Set<string>();
  for (const e of getEntries(log)) if (e.projectName) names.add(e.projectName);
  if (log.project?.name) names.add(log.project.name);
  return Array.from(names);
};

/** Hours for the report: server total, else the sum of its task lines. */
export const getReportHours = (log: DailyStatus): number => {
  if (log.totalHours) return log.totalHours;
  return getEntries(log).reduce((sum, e) => sum + e.hours, 0);
};

export const TASK_STATUS_META: Record<string, { label: string; color: string }> = {
  unassigned: { label: 'Unassigned', color: 'gray' },
  assigned: { label: 'Assigned', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'orange' },
  in_review: { label: 'In Review', color: 'grape' },
  completed: { label: 'Completed', color: 'green' },
  on_hold: { label: 'On Hold', color: 'yellow' },
};

export const formatSubmittedTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
