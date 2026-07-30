import { z } from 'zod';
import { Role } from '../../types';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(Role),
    department: z.enum(['design', 'development', 'seo']).optional().or(z.literal('')).transform((val) => (val === '' ? undefined : val)),
  }),
});
