import { z } from 'zod';

export const createMilestoneSchema = z.object({
  body: z.object({
    project: z.string().min(1, 'Project ID is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    estimatedHours: z.number().min(0, 'Estimated hours cannot be negative'),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  })
}).refine(data => {
  if (data.body.startDate && data.body.endDate) {
    return new Date(data.body.endDate) >= new Date(data.body.startDate);
  }
  return true;
}, {
  message: "End Date cannot be before Start Date",
  path: ["body", "endDate"],
});

export const updateMilestoneSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    estimatedHours: z.number().min(0).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed']).optional(),
  })
}).refine(data => {
  if (data.body.startDate && data.body.endDate) {
    return new Date(data.body.endDate) >= new Date(data.body.startDate);
  }
  return true;
}, {
  message: "End Date cannot be before Start Date",
  path: ["body", "endDate"],
});
