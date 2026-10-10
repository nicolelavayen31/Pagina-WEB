import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/cta-band';
import { PageHero } from '@/components/page-hero';
import { ServiceCard } from '@/components/service-card';
import { getPublicServices } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Servicios' };

/*
 * Services = what the company offers (specialities). Concrete jobs live in /proyectos.
 * A single quote call-to-action closes the page instead of one identical button per card.
 */
export default async function ServicesPage() {
  const services = await getPublicServices().catch(() => null);

  return (
    <main className="page-stack">
      <PageHero
        eyebrow="Servicios"
        title="Lo que diseñamos y construimos"
        text="Especialidades de la empresa en sistemas de control, tableros eléctricos y equipos para la industria."
      />

      <section className="surface-section" aria-labelledby="catalogo-titulo">
        <div className="section-head">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 id="catalogo-titulo">Nuestras especialidades</h2>
          </div>
          <Link href="/proyectos" className="button outline">
            Ver proyectos realizados
          </Link>
        </div>

        {services === null ? (
          <p className="alert error">No se pudieron cargar los servicios. Inténtelo más tarde.</p>
        ) : services.length === 0 ? (
          <p className="hint">Pronto publicaremos nuestro catálogo de servicios.</p>
        ) : (
          <div className="service-catalogue">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} variant="catalogue" />
            ))}
          </div>
        )}
      </section>

      <CtaBand
        title="¿Necesitas alguno de estos servicios?"
        text="Cuéntanos tu necesidad y te responderemos con una propuesta."
        action="Solicitar cotización"
      />
    </main>
  );
}
