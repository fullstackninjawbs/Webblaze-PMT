import { z } from 'zod';

const entrySchema = z.object({
  task: z.string().optional().nullable(),
  title: z.string().trim().min(1, 'Entry text cannot be empty'),
});

// hours, project and status on entries are derived server-side, never accepted from the client
export const createDailyStatusSchema = z.object({
  body: z.object({
    project: z.string().optional().nullable(),
    workDone: z.string().min(1, 'Work done description is required'),
    plannedWork: z.string().optional(),
    blockers: z.string().optional(),
    entries: z.array(entrySchema).optional(),
  }),
});
