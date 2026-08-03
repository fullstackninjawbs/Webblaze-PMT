import { z } from 'zod';

export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    user: z.string().optional(), // Admin/PM can assign to others, but we'll default to self in controller if omitted
    relatedProject: z.string().optional(),
    estimatedTime: z.number().min(0).optional(),
    status: z.enum(['pending', 'in_progress', 'blocked', 'done']).optional(),
    dueDate: z.string().optional(),
  }),
});

export const updateTodoSchema = z.object({
  body: createTodoSchema.shape.body.partial(),
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});
