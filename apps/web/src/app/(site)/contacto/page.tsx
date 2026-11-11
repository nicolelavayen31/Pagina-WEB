import type { Metadata } from 'next';
import { ContactDetails } from '@/components/contact-details';
import { WhatsAppIcon } from '@/components/icons';
import { QuoteForm } from '@/modules/contact/components/quote-form';
import { getPublicServices } from '@/modules/services/api';
import { whatsappHref } from '@/shared/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Contacto' };

const STEPS = ['Cuéntanos qué necesitas', 'Revisamos alcance y visitamos el sitio', 'Recibes tu propuesta por correo'];

export default async function ContactPage() {
  const services = await getPublicServices().catch(() => []);
  const whatsapp = whatsappHref();

  return (
    <main id="cotizar" className="quote-layout">
      <section className="quote-intro on-dark" aria-labelledby="cotizar-titulo">
        <div className="quote-intro__main">
          <p className="eyebrow">Cotización</p>
          <h1 id="cotizar-titulo">Solicita una cotización sin compromiso</h1>
          <p>
            Comparte el detalle de tu necesidad y te responderemos con una propuesta enfocada en costo, cronograma y
            alcance.
          </p>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step}>
                <span className="steps__number" aria-hidden="true">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        {whatsapp ? (
          <div className="quote-intro__contact">
            <p>¿Prefieres hablar directamente?</p>
            <a className="button accent" href={whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Escríbenos por WhatsApp
            </a>
            <ContactDetails className="contact-details--intro" />
          </div>
        ) : null}
      </section>

      <section className="quote-card" aria-label="Formulario de cotización">
        <QuoteForm services={services} idPrefix="contacto" />
      </section>
    </main>
  );
}
