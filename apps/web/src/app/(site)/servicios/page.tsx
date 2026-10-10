import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicServices } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Servicios' };

export default async function ServicesPage() {
  const services = await getPublicServices().catch(() => []);

  return (
    <main className="container section">
      <h1>Servicios</h1>
      {services.length === 0 ? (
        <p>Pronto publicaremos nuestro catálogo de servicios.</p>
      ) : (
        <div className="grid grid-3">
          {services.map((service) => (
            <article key={service.id} className="card" style={{ padding: 24 }}>
              <h2>{service.name}</h2>
              <p>{service.summary}</p>
              <p className="hint">{service.description}</p>
              <Link href="/contacto#cotizar" className="button primary">
                Solicitar cotización
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
