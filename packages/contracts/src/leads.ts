import { z } from 'zod';
import { paginationSchema } from './pagination';

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

/** Row of `GET /admin/leads`. Dates travel as ISO strings. */
export type AdminLead = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  serviceId: string | null;
  location: string;
  description: string;
  budgetRange: BudgetRange | null;
  status: LeadStatusName;
  privacyNoticeVersion: string | null;
  consentAt: string | null;
  createdAt: string;
  updatedAt: string;
  service: { id: string; name: string } | null;
};
