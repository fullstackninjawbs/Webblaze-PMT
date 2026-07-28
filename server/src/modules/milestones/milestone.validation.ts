import { z } from 'zod';

export const createMilestoneSchema = z.object({
  body: z.object({
    project: z.string().min(1, 'Project ID is required'),
    title: z.string().min(1, 'Title is required'),
    estimatedHours: z.number().min(0, 'Estimated hours cannot be negative'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  }),
});

export const updateMilestoneSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    estimatedHours: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  }),
});
