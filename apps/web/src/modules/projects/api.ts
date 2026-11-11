import type { Paginated, PublicProject } from '@repo/contracts';
import { apiFetch } from '@/shared/api/client';

export const getPublicProjects = (page = 1, pageSize = 12) =>
  apiFetch<Paginated<PublicProject>>(`/projects?page=${page}&pageSize=${pageSize}`);

/** All published projects via the existing paginated endpoint (50 per page, capped). */
export async function getAllPublicProjects(maxPages = 10): Promise<PublicProject[]> {
  const pageSize = 50;
  const first = await getPublicProjects(1, pageSize);
  const items = [...first.items];
  const pages = Math.min(maxPages, Math.ceil(first.total / pageSize));
  for (let page = 2; page <= pages; page++) {
    items.push(...(await getPublicProjects(page, pageSize)).items);
  }
  return items;
}

export const getPublicProjectBySlug = (slug: string) =>
  apiFetch<PublicProject>(`/projects/${encodeURIComponent(slug)}`);
