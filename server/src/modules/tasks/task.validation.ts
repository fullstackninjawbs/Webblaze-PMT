import { z } from 'zod';

const TASK_STATUSES = ['unassigned', 'assigned', 'in_progress', 'in_review', 'completed', 'on_hold'] as const;

/** PM decision on a task that is In Review. A rejection needs a reason for the assignee. */
export const reviewTaskSchema = z.object({
  body: z.object({
    decision: z.enum(['approve', 'reject']),
    reason: z.string().trim().max(2000).optional(),
  }).refine((b) => b.decision === 'approve' || (b.reason && b.reason.length > 0), {
    message: 'A reason is required when rejecting',
    path: ['reason'],
  }),
});
const DEPARTMENTS = ['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales'] as const;

const dateOrder = {
  check: (data: { body: { startDate?: string | null; endDate?: string | null } }) => {
    if (data.body.startDate && data.body.endDate) {
      return new Date(data.body.endDate) >= new Date(data.body.startDate);
    }
    return true;
  },
  options: { message: 'End Date cannot be before Start Date', path: ['body', 'endDate'] },
};

// spentHours is intentionally absent: it is derived from time logs and never accepted from the client.
export const createTaskSchema = z.object({
  body: z.object({
    milestone: z.string().min(1, 'Milestone ID is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    department: z.enum(DEPARTMENTS).optional().nullable(),
    estimatedHours: z.number().min(0.5, 'Minimum estimate is 0.5 hours'),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    status: z.enum(TASK_STATUSES).optional(),
    workSummary: z.string().optional().nullable(),
    prLink: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
  }),
}).refine(dateOrder.check, dateOrder.options);

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    department: z.enum(DEPARTMENTS).optional().nullable(),
    estimatedHours: z.number().min(0.5, 'Minimum estimate is 0.5 hours').optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    status: z.enum(TASK_STATUSES).optional(),
    workSummary: z.string().optional().nullable(),
    prLink: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
  }),
}).refine(dateOrder.check, dateOrder.options);
