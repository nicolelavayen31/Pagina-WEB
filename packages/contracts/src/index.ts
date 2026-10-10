import { z } from 'zod';

// ---------------------------------------------------------------------------
// Roles and permissions (single source of truth for API, seed and web)
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  'project:read',
  'project:create',
  'project:update',
  'project:publish',
  'project:unpublish',
  'project:archive',
  'project:delete',
  'project:assign_author',
  'media:upload',
  'media:delete',
  'service:read',
  'service:write',
  'lead:read',
  'lead:update_status',
  'audit:read',
  'user:manage',
  'role:manage',
] as const;

export type PermissionName = (typeof PERMISSIONS)[number];

export const ROLES = ['ADMIN', 'PROJECT_MANAGER'] as const;
export type RoleName = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionName[]> = {
  ADMIN: PERMISSIONS,
  PROJECT_MANAGER: [
    'project:read',
    'project:create',
    'project:update',
    'project:archive',
    'media:upload',
    'media:delete',
  ],
};

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.string().min(10),
    SESSION_TTL_MS: z.coerce
      .number()
      .int()
      .min(60_000)
      .max(30 * 24 * 60 * 60 * 1000)
      .default(8 * 60 * 60 * 1000),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    TURNSTILE_SECRET_KEY: z.string().default(''),
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    UPLOAD_DIR: z.string().min(1).default('./uploads'),
    UPLOAD_MAX_BYTES: z.coerce.number().int().min(1024).default(10 * 1024 * 1024),
    RATE_LIMIT_LOGIN: z.coerce.number().int().min(1).default(5),
    RATE_LIMIT_LEADS: z.coerce.number().int().min(1).default(3),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.TURNSTILE_SECRET_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['TURNSTILE_SECRET_KEY'],
        message: 'TURNSTILE_SECRET_KEY is required in production',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

// ---------------------------------------------------------------------------
// Leads (quote requests)
// ---------------------------------------------------------------------------

export const PRIVACY_NOTICE_VERSION = 'v1';

export const BUDGET_RANGES = [
  'UNDER_1K',
  'FROM_1K_TO_5K',
  'FROM_5K_TO_20K',
  'FROM_20K_TO_50K',
  'OVER_50K',
  'UNKNOWN',
] as const;

export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  UNDER_1K: 'Menos de USD 1.000',
  FROM_1K_TO_5K: 'USD 1.000 – 5.000',
  FROM_5K_TO_20K: 'USD 5.000 – 20.000',
  FROM_20K_TO_50K: 'USD 20.000 – 50.000',
  OVER_50K: 'Más de USD 50.000',
  UNKNOWN: 'Aún no lo sé',
};

export const LEAD_STATUSES = ['NEW', 'IN_REVIEW', 'CONTACTED', 'QUOTED', 'CLOSED'] as const;
export type LeadStatusName = (typeof LEAD_STATUSES)[number];

export const leadCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    company: z.string().trim().max(120).optional(),
    email: z.email().max(254),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^[0-9+()\-\s]+$/, 'Teléfono inválido'),
    serviceId: z.string().trim().min(1).max(40).optional(),
    location: z.string().trim().min(2).max(120),
    description: z.string().trim().min(20).max(2000),
    budgetRange: z.enum(BUDGET_RANGES).optional(),
    privacyAccepted: z.literal(true),
    // Honeypot: real users never fill it. Never persisted.
    website: z.string().max(200).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();

export type LeadInput = z.infer<typeof leadCreateSchema>;

export const leadStatusUpdateSchema = z.object({ status: z.enum(LEAD_STATUSES) }).strict();

export const leadListQuerySchema = paginationSchema.extend({
  status: z.enum(LEAD_STATUSES).optional(),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const PROJECT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ProjectStatusName = (typeof PROJECT_STATUSES)[number];

const projectFields = {
  title: z.string().trim().min(3).max(160),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  summary: z.string().trim().min(20).max(240),
  description: z.string().trim().min(80).max(5000),
  category: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(160),
};

// Status, authorship and publication dates are controlled by the server only.
export const projectCreateSchema = z.object(projectFields).strict();

export const projectUpdateSchema = z
  .object({
    ...projectFields,
    coverImageId: z.uuid().nullable(),
  })
  .partial()
  .strict();

export const projectAuthorSchema = z.object({ userId: z.string().min(1).max(40) }).strict();

export const projectImageMetaSchema = z
  .object({
    altText: z.string().trim().max(200).optional(),
    caption: z.string().trim().max(300).optional(),
  })
  .strict();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public DTOs consumed by the web app
// ---------------------------------------------------------------------------

export type PublicImage = { id: string; altText: string | null; caption: string | null; sortOrder: number };

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  publishedAt: string | null;
  coverImageId: string | null;
  images: PublicImage[];
};

export type PublicService = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};
