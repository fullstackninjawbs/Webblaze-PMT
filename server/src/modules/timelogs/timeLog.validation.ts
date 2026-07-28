import { z } from 'zod';

export const startTimerSchema = z.object({
  body: z.object({
    taskId: z.string().min(1, 'Task ID is required'),
    description: z.string().optional(),
  }),
});

export const stopTimerSchema = z.object({
  body: z.object({
    description: z.string().optional(),
  }),
});
