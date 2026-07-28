import { z } from 'zod';
import { ProjectStatus } from '../../types';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    client: z.string().min(1, 'Client ID is required'),
    totalBudget: z.number().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    team: z.array(z.string()).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: createProjectSchema.shape.body.partial(),
  params: z.object({
    id: z.string(),
  }),
});
