import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url().or(z.string().min(10)),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const leadCreateSchema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  serviceId: z.string().min(1).optional(),
  location: z.string().min(2).max(120),
  description: z.string().min(20).max(2000),
  budget: z.string().max(80).optional().or(z.literal('')),
  privacyNoticeVersion: z.string().min(1).max(40),
  consentAt: z.string().datetime().optional(),
  website: z.string().max(200).optional().or(z.literal('')),
  hp: z.string().max(20).optional().or(z.literal('')),
});

export const projectCreateSchema = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(20).max(240),
  description: z.string().min(80).max(5000),
  category: z.string().min(2).max(80),
  location: z.string().min(2).max(160),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  coverImageId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  updatedById: z.string().uuid().optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type LeadInput = z.infer<typeof leadCreateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type EnvConfig = z.infer<typeof envSchema>;
