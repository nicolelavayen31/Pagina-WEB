import type { Metadata } from 'next';
import { QuoteForm } from '@/components/quote-form';
import { getPublicServices } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Contacto' };

export default async function ContactPage() {
  const services = await getPublicServices().catch(() => []);

  return (
    <main className="container section">
      <h1>Contacto</h1>
      <div id="cotizar" className="split even">
        <div>
          <p>
            Cuéntenos qué necesita y le responderemos con una propuesta. Los campos marcados como obligatorios son
            necesarios para poder contactarle.
          </p>
        </div>
        <QuoteForm services={services} idPrefix="contacto" />
      </div>
    </main>
  );
}
