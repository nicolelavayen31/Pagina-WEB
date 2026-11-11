import Image from 'next/image';
import Link from 'next/link';
import { ClientShowcase } from '@/components/client-showcase';
import { CtaBand } from '@/components/cta-band';
import { HeroCarousel } from '@/components/hero-carousel';
import { ArrowRightIcon } from '@/components/icons';
import { ProjectCard } from '@/modules/projects/components/project-card';
import { ServiceCard } from '@/modules/services/components/service-card';
import { getPublicProjects } from '@/modules/projects/api';
import { getPublicServices } from '@/modules/services/api';
import { HERO_SLIDES, WORK_GALLERY } from '@/shared/content/site-photos';

export const dynamic = 'force-dynamic';

const WORK_SUMMARY = [
  'Planificación técnica y presupuestaria',
  'Gestión de obra y proveedores',
  'Mantenimiento integral',
];

/* How we work: a process, not invented figures. */
const PILLARS = [
  {
    title: 'Diagnóstico en sitio',
    text: 'Visitamos la instalación, medimos y revisamos el equipo para entender el problema antes de proponer una solución.',
  },
  {
    title: 'Ejecución profesional',
    text: 'Montaje, cableado, programación y obra civil con materiales adecuados y respeto por la operación del cliente.',
  },
  {
    title: 'Entrega y seguimiento',
    text: 'Pruebas de funcionamiento, explicación al personal y mantenimiento posterior para que el equipo siga en marcha.',
  },
];

/*
 * Action hierarchy on this page (one main action per block):
 * hero -> quote (primary) + services (secondary); mosaic -> projects; band -> quote.
 */
export default async function HomePage() {
  const [services, projects] = await Promise.all([
    getPublicServices().catch(() => []),
    getPublicProjects(1, 3)
      .then((page) => page.items)
      .catch(() => []),
  ]);

  return (
    <main className="home">
      <HeroCarousel slides={HERO_SLIDES} labelledBy="hero-titulo">
        <p className="eyebrow eyebrow--accent">Soluciones integrales para la industria y la construcción</p>
        <h1 id="hero-titulo">Mantenimientos Integrales y Construcciones</h1>
        <p>
          Construcción, mantenimiento y automatización con enfoque operativo. Ejecución profesional, trazabilidad y
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

      <section className="home-intro" aria-labelledby="intro-titulo">
        <div className="home-container home-intro__inner">
          <p className="eyebrow">Quiénes somos</p>
          <h2 id="intro-titulo">
            Mantenemos en marcha los equipos y espacios de los que depende <span>tu operación</span>.
          </h2>
          <div className="home-intro__text">
            <p>
              Diseñamos, montamos y mantenemos tableros de control, sistemas neumáticos, instalaciones eléctricas y
              cámaras de frío, y ejecutamos obras y remodelaciones para empresas y particulares.
            </p>
            <Link href="/nosotros" className="text-link">
              Conócenos
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-band" aria-labelledby="especialidades-titulo">
        <div className="home-container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Especialidades</p>
              <h2 id="especialidades-titulo">Trabajo real, en campo</h2>
            </div>
            <Link href="/proyectos" className="button secondary">
              Ver trabajos realizados
            </Link>
          </div>
          <ul className="mosaic">
            {WORK_GALLERY.map((item) => (
              <li key={item.id} className="mosaic__tile">
                <Image
                  src={item.photo.src}
                  alt={item.photo.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 40vw"
                  style={{ objectPosition: item.photo.position ?? 'center' }}
                />
                <div className="mosaic__caption on-dark">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-band home-band--white" aria-labelledby="servicios-titulo">
        <div className="home-container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Servicios destacados</p>
              <h2 id="servicios-titulo">Todo lo que tu planta, edificio u obra necesita</h2>
            </div>
            <Link href="/servicios" className="text-link">
              Ver catálogo completo
              <ArrowRightIcon />
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
        </div>
      </section>

      <section className="home-pillars on-dark" aria-labelledby="pilares-titulo">
        <div className="home-container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Cómo trabajamos</p>
              <h2 id="pilares-titulo">Del diagnóstico a la entrega, sin cabos sueltos</h2>
            </div>
          </div>
          <ol className="pillars">
            {PILLARS.map((pillar, index) => (
              <li key={pillar.title} className="pillar">
                <span className="pillar__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="home-band" aria-labelledby="proyectos-titulo">
          <div className="home-container">
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
          </div>
        </section>
      ) : null}

      <ClientShowcase />

      <div className="home-container home-cta">
        <CtaBand />
      </div>
    </main>
  );
}
