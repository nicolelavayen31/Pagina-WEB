import Link from 'next/link';

export function CtaBand({
  title = 'Solicita una cotización sin compromiso',
  text = 'Comparte el detalle de tu necesidad y te responderemos con una propuesta enfocada en costo, cronograma y alcance.',
  action = 'Empezar ahora',
}: {
  title?: string;
  text?: string;
  action?: string;
}) {
  return (
    <section className="cta-band on-dark" aria-labelledby="cta-titulo">
      <div>
        <h2 id="cta-titulo">{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      <Link href="/contacto#cotizar" className="button light">
        {action}
      </Link>
    </section>
  );
}
