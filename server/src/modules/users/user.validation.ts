import { z } from 'zod';
import { Role } from '../../types';

const DEPARTMENTS = ['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales'] as const;

/** Fields an admin may change on any user. Anything else (tokenVersion, reset tokens, password) is dropped. */
export const adminUpdateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().trim().toLowerCase().email('Invalid email format').optional(),
    role: z.nativeEnum(Role).optional(),
    department: z.enum(DEPARTMENTS).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
    isActive: z.boolean().optional(),
    avatarUrl: z.string().trim().optional(),
  }),
});

/** Fields any user may change on their own profile. */
export const updateMyProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().trim().toLowerCase().email('Invalid email format').optional(),
    avatarUrl: z.string().trim().optional(),
  }),
});
