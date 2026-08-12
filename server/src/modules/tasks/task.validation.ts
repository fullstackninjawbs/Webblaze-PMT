import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    milestone: z.string().min(1, 'Milestone ID is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales']).optional().nullable(),
    estimatedHours: z.number().min(0, 'Estimated hours cannot be negative'),
    spentHours: z.number().min(0).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    status: z.enum(['assigned', 'in_progress', 'in_review', 'completed', 'on_hold']).optional(),
    workSummary: z.string().optional().nullable(),
    prLink: z.string().optional().nullable(),
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

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales']).optional().nullable(),
    estimatedHours: z.number().min(0).optional(),
    spentHours: z.number().min(0).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    status: z.enum(['assigned', 'in_progress', 'in_review', 'completed', 'on_hold']).optional(),
    workSummary: z.string().optional().nullable(),
    prLink: z.string().optional().nullable(),
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
