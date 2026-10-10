import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/cta-band';
import { PageHero } from '@/components/page-hero';
import { ProjectCard } from '@/components/project-card';
import { getAllPublicProjects } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Proyectos' };

const PAGE_SIZE = 12;

type SearchParams = Promise<{ page?: string; categoria?: string }>;

function href(category: string | null, page = 1) {
  const params = new URLSearchParams();
  if (category) params.set('categoria', category);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/proyectos${query ? `?${query}` : ''}`;
}

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const { page: pageParam, categoria } = await searchParams;
  const projects = await getAllPublicProjects().catch(() => null);

  // Filters come from the categories of the projects that are actually published.
  const categories = projects
    ? Array.from(new Set(projects.map((project) => project.category.trim()))).sort((a, b) => a.localeCompare(b, 'es'))
    : [];
  const active = categoria && categories.includes(categoria) ? categoria : null;
  const filtered = projects?.filter((project) => !active || project.category.trim() === active) ?? [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="page-stack">
      {/* Projects = concrete jobs already delivered (created from the admin panel with real data). */}
      <PageHero
        eyebrow="Proyectos"
        title="Obras que hablan por nosotros"
        text="Trabajos concretos realizados por nuestro equipo."
      />

      <section className="surface-section" aria-label="Catálogo de proyectos">
        {projects === null ? (
          <p className="alert error">No se pudieron cargar los proyectos. Inténtelo más tarde.</p>
        ) : projects.length === 0 ? (
          <p className="hint">
            Pronto publicaremos los trabajos realizados. Mientras tanto, puede conocer nuestras{' '}
            <Link href="/servicios" className="table-link">
              especialidades
            </Link>
            .
          </p>
        ) : (
          <>
            {categories.length > 1 ? (
              <nav className="filter-bar" aria-label="Filtrar por categoría">
                <Link href={href(null)} className="filter-pill" aria-current={active === null ? 'page' : undefined}>
                  Todos
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={href(category)}
                    className="filter-pill"
                    aria-current={active === category ? 'page' : undefined}
                  >
                    {category}
                  </Link>
                ))}
              </nav>
            ) : null}

            <p className="sr-only" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'proyecto' : 'proyectos'}
              {active ? ` en ${active}` : ''}
            </p>

            <div className="project-grid project-grid--catalog">
              {visible.map((project) => (
                <ProjectCard key={project.id} project={project} headingLevel="h2" variant="detailed" />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="pagination" aria-label="Paginación">
                {page > 1 ? (
                  <Link className="button outline" href={href(active, page - 1)}>
                    Anterior
                  </Link>
                ) : null}
                <span>
                  Página {page} de {totalPages}
                </span>
                {page < totalPages ? (
                  <Link className="button outline" href={href(active, page + 1)}>
                    Siguiente
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        )}
      </section>

      <CtaBand title="¿Tienes un proyecto parecido? Cuéntanos qué necesitas." text="" action="Solicitar cotización" />
    </main>
  );
}
