import Link from 'next/link';
import { ContactDetails } from './contact-details';
import { ArrowRightIcon } from './icons';

const COLUMNS = [
  {
    title: 'Empresa',
    links: [
      { href: '/', label: 'Inicio' },
      { href: '/nosotros', label: 'Nosotros' },
      { href: '/proyectos', label: 'Proyectos' },
    ],
  },
  {
    title: 'Servicios',
    links: [
      { href: '/servicios', label: 'Catálogo de servicios' },
      { href: '/contacto#cotizar', label: 'Solicitar cotización' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacidad', label: 'Política de privacidad' },
      { href: '/terminos', label: 'Términos y condiciones' },
    ],
  },
];

/* WhatsApp is not repeated here: the floating button is visible on every public page. */
export function SiteFooter() {
  return (
    <footer className="site-footer on-dark">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="brand__mark" aria-hidden="true">
              MI
            </span>
            <div>
              <strong>Mantenimientos Integrales y Construcciones</strong>
              <p>Soluciones técnicas para la industria, el comercio y la construcción en Ecuador.</p>
            </div>
          </div>
          <Link href="/contacto#cotizar" className="site-footer__cta">
            Cuéntanos tu proyecto
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="site-footer__columns">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <h2>Contacto</h2>
            <ContactDetails />
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} Mantenimientos Integrales y Construcciones. Todos los derechos reservados.</p>
          <a href="#contenido" className="site-footer__top-link">
            Volver arriba ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
