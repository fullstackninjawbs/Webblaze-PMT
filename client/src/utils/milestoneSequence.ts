import { parseLocalDateString } from './dateUtils';

interface MilestoneLike {
  _id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
}

export interface MilestoneAnchor {
  milestone: MilestoneLike;
  anchor: Date;
  basis: 'end' | 'start';
  /** Earliest allowed start date for the next milestone (day after the anchor). */
  minStartDate: Date;
}

/**
 * Milestones run in the order they were added. The previous milestone is the most recently
 * created one (before `editing` when editing) that has any date. Its end date is the anchor,
 * or its start date if it has no end date. The next milestone must start after that day.
 *
 * Mirrors the server rule in milestone.service.ts so the picker and the API agree.
 */
export const getPreviousMilestoneAnchor = (
  milestones: MilestoneLike[],
  editing?: MilestoneLike | null
): MilestoneAnchor | null => {
  const editingCreated = editing?.createdAt ? new Date(editing.createdAt).getTime() : null;

  const candidates = milestones
    .filter((m) => m._id !== editing?._id)
    .filter((m) => m.endDate || m.startDate)
    .filter((m) => {
      if (editingCreated === null || !m.createdAt) return true;
      return new Date(m.createdAt).getTime() < editingCreated;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const previous = candidates[0];
  if (!previous) return null;

  const basis: 'end' | 'start' = previous.endDate ? 'end' : 'start';
  const anchor = parseLocalDateString(previous.endDate || previous.startDate);
  if (!anchor) return null;

  const minStartDate = new Date(anchor);
  minStartDate.setDate(minStartDate.getDate() + 1);

  return { milestone: previous, anchor, basis, minStartDate };
};

const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Returns an error message when `startDate` violates the anchor, otherwise null. */
export const validateStartAgainstAnchor = (
  startDate: string | null | undefined,
  anchorInfo: MilestoneAnchor | null,
  requireWhenAnchored: boolean
): string | null => {
  if (!anchorInfo) return null;
  const label = `${anchorInfo.basis} date of "${anchorInfo.milestone.title}" (${formatAnchorDate(anchorInfo.anchor)})`;

  const start = startDate ? parseLocalDateString(startDate) : null;
  if (!start) {
    return requireWhenAnchored ? `Start date is required and must be after the ${label}` : null;
  }
  if (toDayKey(start) <= toDayKey(anchorInfo.anchor)) {
    return `Start date must be after the ${label}`;
  }
  return null;
};

export const formatAnchorDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

export const describeAnchor = (anchorInfo: MilestoneAnchor | null): string | undefined => {
  if (!anchorInfo) return undefined;
  return `Must start after "${anchorInfo.milestone.title}" ${anchorInfo.basis === 'end' ? 'ends' : 'starts'} on ${formatAnchorDate(anchorInfo.anchor)}`;
};
