import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    milestone: z.string().min(1, 'Milestone ID is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales']).optional(),
    estimatedHours: z.number().min(0, 'Estimated hours cannot be negative'),
    spentHours: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    assignedTo: z.string().optional(),
    status: z.enum(['assigned', 'in_progress', 'in_review', 'completed']).optional(),
    attachments: z.array(z.string()).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    department: z.enum(['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales']).optional(),
    estimatedHours: z.number().min(0).optional(),
    spentHours: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    assignedTo: z.string().optional().nullable(),
    status: z.enum(['assigned', 'in_progress', 'in_review', 'completed']).optional(),
    attachments: z.array(z.string()).optional(),
  }),
});
