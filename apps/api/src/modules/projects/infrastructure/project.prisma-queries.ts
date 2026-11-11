import type { Prisma } from '@prisma/client';

const imageOrder = [{ sortOrder: 'asc' }, { createdAt: 'asc' }] satisfies Prisma.ProjectImageOrderByWithRelationInput[];

/** Public responses never include authorship, internal ids or storage keys. */
export const publicProjectSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  description: true,
  category: true,
  location: true,
  publishedAt: true,
  coverImageId: true,
  images: { select: { id: true, altText: true, caption: true, sortOrder: true }, orderBy: imageOrder },
} satisfies Prisma.ProjectSelect;

const userSummarySelect = { select: { id: true, name: true, email: true } } as const;

export const adminProjectInclude = {
  images: {
    select: { id: true, altText: true, caption: true, sortOrder: true, width: true, height: true, sizeBytes: true },
    orderBy: imageOrder,
  },
  creator: userSummarySelect,
  updater: userSummarySelect,
} satisfies Prisma.ProjectInclude;

export const publishedProjects = { status: 'PUBLISHED' } satisfies Prisma.ProjectWhereInput;
