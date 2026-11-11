import type { MetadataRoute } from 'next';
import { getAllPublicProjects } from '@/modules/projects/api';

// Built on request: project pages come from the API, which is not running during `next build`.
export const dynamic = 'force-dynamic';

const STATIC_ROUTES = ['/', '/servicios', '/proyectos', '/nosotros', '/contacto', '/privacidad', '/terminos'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const projects = await getAllPublicProjects().catch(() => []);

  return [
    ...STATIC_ROUTES.map((route) => ({ url: `${baseUrl}${route}` })),
    ...projects.map((project) => ({ url: `${baseUrl}/proyectos/${project.slug}` })),
  ];
}
