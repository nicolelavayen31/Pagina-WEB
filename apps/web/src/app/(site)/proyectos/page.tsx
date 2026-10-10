import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectCard } from '@/components/project-card';
import { getPublicProjects } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Proyectos' };

const PAGE_SIZE = 12;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const result = await getPublicProjects(page, PAGE_SIZE).catch(() => null);
  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <main className="container section">
      <h1>Proyectos</h1>
      {!result ? (
        <p className="alert error">No se pudieron cargar los proyectos. Inténtelo más tarde.</p>
      ) : result.items.length === 0 ? (
        <p>Aún no hay proyectos publicados.</p>
      ) : (
        <div className="grid grid-3">
          {result.items.map((project) => (
            <ProjectCard key={project.id} project={project} headingLevel="h2" />
          ))}
        </div>
      )}
      {totalPages > 1 ? (
        <nav aria-label="Paginación" style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {page > 1 ? <Link className="button ghost" href={`/proyectos?page=${page - 1}`}>Anterior</Link> : null}
          <span style={{ alignSelf: 'center' }}>
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? <Link className="button ghost" href={`/proyectos?page=${page + 1}`}>Siguiente</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
