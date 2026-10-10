import Link from 'next/link';
import { ProjectCard } from '@/components/project-card';
import { QuoteForm } from '@/components/quote-form';
import { getPublicProjects, getPublicServices } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [services, projects] = await Promise.all([
    getPublicServices().catch(() => []),
    getPublicProjects(1, 3)
      .then((page) => page.items)
      .catch(() => []),
  ]);

  return (
    <main>
      <section className="hero">
        <div className="container split">
          <div>
            <p style={{ color: 'var(--secondary)', marginBottom: 12 }}>Soluciones integrales para edificios y obras</p>
            <h1>Construcción, mantenimiento y remodelación con enfoque operativo.</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 620 }}>
              Diseñamos y ejecutamos soluciones para propiedades, edificios, negocios y proyectos de mejora continua.
              Nuestro enfoque combina ejecución profesional, trazabilidad y atención cercana.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="#cotizar" className="button primary">
                Solicitar cotización
              </Link>
              <Link href="/proyectos" className="button secondary">
                Ver proyectos
              </Link>
            </div>
          </div>
          <div
            className="card"
            style={{ padding: 24, background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <h2 style={{ fontSize: '1.25rem' }}>Resumen de trabajo</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 16 }}>
              <li>Planificación técnica y presupuestaria</li>
              <li>Gestión de obra y coordinación de proveedores</li>
              <li>Soluciones de mantenimiento integral</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="servicios-titulo">
        <div className="container">
          <h2 id="servicios-titulo" style={{ textAlign: 'center', marginBottom: 32 }}>
            Servicios destacados
          </h2>
          {services.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Pronto publicaremos nuestro catálogo de servicios.</p>
          ) : (
            <div className="grid grid-3">
              {services.map((service) => (
                <article key={service.id} className="card" style={{ padding: 24 }}>
                  <h3>{service.name}</h3>
                  <p>{service.summary}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="section" style={{ background: '#edf4ff' }} aria-labelledby="proyectos-titulo">
          <div className="container">
            <h2 id="proyectos-titulo" style={{ marginBottom: 24 }}>
              Proyectos recientes
            </h2>
            <div className="grid grid-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="cotizar" className="section" aria-labelledby="cotizar-titulo">
        <div className="container split even">
          <div>
            <h2 id="cotizar-titulo">Solicita una cotización sin compromiso</h2>
            <p>
              Comparte el detalle de tu necesidad y te responderemos con una propuesta enfocada en costo, cronograma y
              alcance.
            </p>
          </div>
          <QuoteForm services={services} idPrefix="home" />
        </div>
      </section>
    </main>
  );
}
