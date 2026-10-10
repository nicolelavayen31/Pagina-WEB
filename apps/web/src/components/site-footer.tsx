import Link from 'next/link';
import { whatsappHref } from '@/lib/contact';
import { WhatsAppIcon } from './icons';

export function SiteFooter() {
  const whatsapp = whatsappHref();

  return (
    <footer className="site-footer on-dark">
      <div>
        <strong>Mantenimientos Integrales y Construcciones</strong>
        <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
      </div>
      <nav aria-label="Enlaces legales">
        <Link href="/privacidad">Política de privacidad</Link>
        <Link href="/terminos">Términos y condiciones</Link>
      </nav>
      {whatsapp ? (
        <a className="button accent" href={whatsapp} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          Escríbenos por WhatsApp
        </a>
      ) : null}
    </footer>
  );
}
