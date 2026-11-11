import { z } from 'zod';

export const serviceCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
    summary: z.string().trim().min(10).max(240),
    description: z.string().trim().min(20).max(3000),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .strict();

export const serviceUpdateSchema = serviceCreateSchema.partial().strict();

export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

export type PublicService = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
};

/** Row of `GET /admin/services`. */
export type AdminService = PublicService & { isActive: boolean; sortOrder: number; createdAt: string; updatedAt: string };
