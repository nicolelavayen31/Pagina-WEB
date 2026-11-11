import type { Metadata } from 'next';
import Image from 'next/image';
import { CtaBand } from '@/components/cta-band';
import { PageHero } from '@/components/page-hero';
import { PHOTOS } from '@/shared/content/site-photos';

export const metadata: Metadata = { title: 'Nosotros' };

const VALUES = [
  { title: 'Seguridad', text: 'Trabajamos con procedimientos y protecciones adecuadas en cada intervención eléctrica y mecánica.' },
  { title: 'Trazabilidad', text: 'Documentamos lo que se mide, se cambia y se entrega, para que sepas qué se hizo y por qué.' },
  { title: 'Cercanía', text: 'Te acompañamos antes, durante y después del trabajo, con respuesta directa y sin intermediarios.' },
];

export default function AboutPage() {
  return (
    <main className="page-stack">
      <PageHero
        eyebrow="Nosotros"
        title="Técnica, obra y mantenimiento en un solo equipo"
        text="Somos una empresa orientada a soluciones integrales de mantenimiento, construcción y mejora de espacios para clientes corporativos y particulares."
      />

      <section className="surface-section about-split" aria-labelledby="about-titulo">
        <div className="about-split__media">
          <Image
            src={PHOTOS.electricalMeasurement.src}
            alt={PHOTOS.electricalMeasurement.alt}
            fill
            sizes="(max-width: 860px) 100vw, 50vw"
            style={{ objectPosition: PHOTOS.electricalMeasurement.position }}
          />
        </div>
        <div className="about-split__text">
          <p className="eyebrow">Lo que hacemos</p>
          <h2 id="about-titulo">Resolvemos el problema completo, no solo una parte</h2>
          <p>
            Unimos en un mismo equipo la parte eléctrica, la automatización, la refrigeración y la obra civil. Así el
            cliente tiene un único responsable desde el diagnóstico hasta la puesta en marcha.
          </p>
          <p>
            Cada trabajo empieza en sitio: medimos, revisamos y entendemos cómo opera la instalación antes de proponer
            una solución.
          </p>
        </div>
      </section>

      <section className="surface-section" aria-labelledby="valores-titulo">
        <div className="section-head">
          <div>
            <p className="eyebrow">Nuestros valores</p>
            <h2 id="valores-titulo">Cómo nos comprometemos</h2>
          </div>
        </div>
        <ol className="pillars pillars--light">
          {VALUES.map((value, index) => (
            <li key={value.title} className="pillar">
              <span className="pillar__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <CtaBand />
    </main>
  );
}
