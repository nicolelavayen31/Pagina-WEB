import Link from 'next/link';
import { CtaBand } from '@/components/cta-band';
import { HeroCarousel } from '@/components/hero-carousel';
import { ArrowRightIcon } from '@/components/icons';
import { ProjectCard } from '@/components/project-card';
import { ServiceCard } from '@/components/service-card';
import { getPublicProjects, getPublicServices } from '@/lib/api';
import { HERO_SLIDES } from '@/lib/site-photos';

export const dynamic = 'force-dynamic';

const WORK_SUMMARY = [
  'Planificación técnica y presupuestaria',
  'Gestión de obra y proveedores',
  'Mantenimiento integral',
];

/*
 * Action hierarchy on this page (one main action per block):
 * hero -> quote (primary) + services (secondary); projects -> all projects; band -> quote.
 */
export default async function HomePage() {
  const [services, projects] = await Promise.all([
    getPublicServices().catch(() => []),
    getPublicProjects(1, 3)
      .then((page) => page.items)
      .catch(() => []),
  ]);

  return (
    <main className="page-stack">
      <HeroCarousel slides={HERO_SLIDES} labelledBy="hero-titulo">
        <p className="eyebrow eyebrow--accent">Soluciones integrales para edificios y obras</p>
        <h1 id="hero-titulo">Mantenimientos Integrales y Construcciones</h1>
        <p>
          Construcción, mantenimiento y remodelación con enfoque operativo. Ejecución profesional, trazabilidad y
          atención cercana.
        </p>
        <div className="actions">
          <Link href="/contacto#cotizar" className="button primary">
            Solicitar cotización
            <ArrowRightIcon />
          </Link>
          <Link href="/servicios" className="button accent">
            Conocer servicios
          </Link>
        </div>
        <ul className="tag-list" aria-label="Resumen de trabajo">
          {WORK_SUMMARY.map((item) => (
            <li key={item} className="tag">
              {item}
            </li>
          ))}
        </ul>
      </HeroCarousel>

      <section className="surface-section" aria-labelledby="servicios-titulo">
        <div className="section-head">
          <div>
            <p className="eyebrow">Servicios destacados</p>
            <h2 id="servicios-titulo">Todo lo que tu edificio u obra necesita</h2>
          </div>
        </div>
        {services.length === 0 ? (
          <p className="hint">Pronto publicaremos nuestro catálogo de servicios.</p>
        ) : (
          <div className="service-grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      {projects.length > 0 ? (
        <section className="surface-section" aria-labelledby="proyectos-titulo">
          <div className="section-head">
            <div>
              <p className="eyebrow">Proyectos</p>
              <h2 id="proyectos-titulo">Trabajos recientes</h2>
            </div>
            <Link href="/proyectos" className="button secondary">
              Ver todos los proyectos
            </Link>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      <CtaBand />
    </main>
  );
}
