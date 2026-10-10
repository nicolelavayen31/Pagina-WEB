import type { Paginated, PublicProject, PublicService } from '@repo/contracts';

export type { PublicProject, PublicService };

/**
 * Server components call the API directly; the browser goes through the Next.js rewrite
 * (`/api/*`), so cookies stay first-party and no CORS is involved.
 */
function apiBase(): string {
  if (typeof window === 'undefined') {
    return `${(process.env.API_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')}/api/v1`;
  }
  return '/api/v1';
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Array<{ path: string; message: string }> = [],
  ) {
    super(message);
  }
}

/** Messages shown to visitors never echo raw backend errors. */
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Revise los datos del formulario e inténtelo de nuevo.';
      case 401:
        return 'Su sesión no es válida o ha expirado.';
      case 403:
        return 'No tiene permiso para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 409:
        return 'Ya existe un registro con esos datos.';
      case 413:
        return 'El archivo supera el tamaño máximo permitido.';
      case 415:
        return 'Formato de archivo no permitido. Use JPEG, PNG o WebP.';
      case 429:
        return 'Ha realizado demasiadas solicitudes. Espere un minuto e inténtelo de nuevo.';
      default:
        return 'Ha ocurrido un error inesperado. Inténtelo más tarde.';
    }
  }
  return 'No se pudo conectar con el servidor. Inténtelo más tarde.';
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBase()}${path}`, { cache: 'no-store', ...init, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: unknown; errors?: unknown };
    throw new ApiError(
      response.status,
      typeof body.message === 'string' ? body.message : `HTTP ${response.status}`,
      Array.isArray(body.errors) ? (body.errors as Array<{ path: string; message: string }>) : [],
    );
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const mediaUrl = (imageId: string) => `/api/v1/media/${imageId}`;

export const getPublicServices = () => apiFetch<PublicService[]>('/services');

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

export const createLead = (payload: Record<string, unknown>) =>
  apiFetch<{ success: boolean }>('/leads', { method: 'POST', body: JSON.stringify(payload) });
