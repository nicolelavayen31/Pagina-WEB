import Image from 'next/image';
import Link from 'next/link';
import { CtaBand } from '@/components/cta-band';
import { ArrowRightIcon } from '@/components/icons';
import { ProjectCard } from '@/components/project-card';
import { ServiceCard } from '@/components/service-card';
import { getPublicProjects, getPublicServices } from '@/lib/api';
import { HERO_PHOTO } from '@/lib/site-photos';

export const dynamic = 'force-dynamic';

const WORK_SUMMARY = [
  'Planificación técnica y presupuestaria',
  'Gestión de obra y proveedores',
  'Mantenimiento integral',
];

export default async function HomePage() {
  const [services, projects] = await Promise.all([
    getPublicServices().catch(() => []),
    getPublicProjects(1, 3)
      .then((page) => page.items)
      .catch(() => []),
  ]);

  return (
    <main className="page-stack">
      <section className="hero on-dark" aria-labelledby="hero-titulo">
        <Image
          src={HERO_PHOTO.src}
          alt={HERO_PHOTO.alt}
          fill
          priority
          sizes="(max-width: 1440px) 100vw, 1440px"
          className="hero__image"
          style={{ objectPosition: HERO_PHOTO.position }}
        />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__content">
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
            <Link href="/proyectos" className="button accent">
              Ver proyectos
            </Link>
          </div>
          <ul className="tag-list" aria-label="Resumen de trabajo">
            {WORK_SUMMARY.map((item) => (
              <li key={item} className="tag">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-section" aria-labelledby="servicios-titulo">
        <div className="section-head">
          <div>
            <p className="eyebrow">Servicios destacados</p>
            <h2 id="servicios-titulo">Todo lo que tu edificio u obra necesita</h2>
          </div>
          <Link href="/contacto#cotizar" className="button outline">
            Pedir asesoría
          </Link>
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
