import { z } from 'zod';

export const createDailyStatusSchema = z.object({
  body: z.object({
    project: z.string().optional().nullable(),
    workDone: z.string().min(1, 'Work done description is required'),
    plannedWork: z.string().min(1, 'Planned work description is required'),
    blockers: z.string().optional(),
    date: z.string().optional(),
  }),
});
