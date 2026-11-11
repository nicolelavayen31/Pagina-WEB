import { z } from 'zod';

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

type UserSummary = { id: string; name: string; email: string };

export type AdminProjectImage = PublicImage & { width: number; height: number; sizeBytes: number };

/** Response of the `/admin/projects` endpoints. Dates travel as ISO strings. */
export type AdminProject = Omit<PublicProject, 'images'> & {
  status: ProjectStatusName;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  images: AdminProjectImage[];
  creator: UserSummary;
  updater: UserSummary | null;
};
