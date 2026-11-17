/** Label and color for every task status, shared by all task lists and pages. */
export const TASK_STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  unassigned: { label: 'New', color: 'gray' },
  assigned: { label: 'Assigned', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'orange' },
  in_review: { label: 'In Review', color: 'grape' },
  rejected: { label: 'Rejected', color: 'red' },
  completed: { label: 'Completed', color: 'green' },
  on_hold: { label: 'On Hold', color: 'yellow' },
};

export const taskStatusDisplay = (status?: string) =>
  TASK_STATUS_DISPLAY[status || ''] || { label: (status || 'assigned').replace('_', ' '), color: 'gray' };
