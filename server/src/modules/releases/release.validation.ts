import { z } from 'zod';

export const createReleaseSchema = z.object({
  body: z.object({
    project: z.string().min(1, 'Project ID is required'),
    department: z.enum(['design', 'development', 'seo']),
    teamMember: z.string().optional(),
    details: z.string().min(1, 'Details are required'),
    releaseDate: z.string().datetime(),
    status: z.enum(['draft', 'scheduled', 'in_review', 'released']).optional(),
  }),
});

export const updateReleaseSchema = z.object({
  body: z.object({
    project: z.string().optional(),
    department: z.enum(['design', 'development', 'seo']).optional(),
    teamMember: z.string().optional().nullable(),
    details: z.string().optional(),
    releaseDate: z.string().datetime().optional(),
    status: z.enum(['draft', 'scheduled', 'in_review', 'released']).optional(),
  }),
});
