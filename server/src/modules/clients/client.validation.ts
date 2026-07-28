import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    contactNumber: z.string().optional(),
    country: z.string().optional(),
    companyName: z.string().optional(),
    source: z.enum(['upwork', 'direct']).optional(),
    billingType: z.enum(['hourly', 'fixed']).optional(),
  }),
});

export const updateClientSchema = z.object({
  body: createClientSchema.shape.body.partial(),
  params: z.object({
    id: z.string(),
  }),
});
