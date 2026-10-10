export type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  status: string;
  coverImageId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images?: Array<{ id: string; storageKey: string; altText?: string | null; caption?: string | null; sortOrder: number }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function handle<T>(url: string): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getPublicServices = () => handle<Array<{ id: string; name: string; slug: string; summary: string }>>('/services');
export const getPublicProjects = () => handle<ProjectItem[]>('/projects');
export const getPublicProjectBySlug = (slug: string) => handle<ProjectItem>(`/projects/${slug}`);

export const createLead = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unable to submit lead' }));
    throw new Error(error.message || 'Unable to submit lead');
  }

  return response.json();
};
