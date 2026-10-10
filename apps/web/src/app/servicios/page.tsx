import Link from 'next/link';
import { getPublicServices } from '@/lib/api';

export default async function ServicesPage() {
  const services = await getPublicServices().catch(() => []);

  return (
    <main className="container section">
      <h1>Servicios</h1>
      <div className="grid grid-3">
        {services.map((service) => (
          <article key={service.id} className="card" style={{ padding: 24 }}>
            <h2>{service.name}</h2>
            <p>{service.summary}</p>
            <Link href="/contacto" className="button primary">Solicitar cotización</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
