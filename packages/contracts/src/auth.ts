import { z } from 'zod';
import { ROLES, type RoleName } from './permissions';

export const loginSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(8).max(128),
  })
  .strict();

export const userCreateSchema = z
  .object({
    email: z.email().max(254),
    name: z.string().trim().min(2).max(120),
    password: z.string().min(12).max(128),
    roles: z.array(z.enum(ROLES)).min(1),
  })
  .strict();

export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    isActive: z.boolean().optional(),
    roles: z.array(z.enum(ROLES)).min(1).optional(),
  })
  .strict();

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

/** Row of `GET /admin/users`. */
export type AdminUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: RoleName[];
};
