import type { ProjectStatus } from '../domain/project';

export type PublicProjectImageView = { id: string; altText: string | null; caption: string | null; sortOrder: number };

/** What the public site may see: no authorship, status, internal dates or storage keys. */
export type PublicProjectView = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  publishedAt: Date | null;
  coverImageId: string | null;
  images: PublicProjectImageView[];
};

export type AdminProjectImageView = PublicProjectImageView & { width: number; height: number; sizeBytes: number };

type UserSummary = { id: string; name: string; email: string };

export type AdminProjectView = Omit<PublicProjectView, 'images'> & {
  status: ProjectStatus;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  images: AdminProjectImageView[];
  creator: UserSummary;
  updater: UserSummary | null;
};

export type ProjectDetails = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  location: string;
};

export type ProjectChanges = Partial<ProjectDetails> & { coverImageId?: string | null };
