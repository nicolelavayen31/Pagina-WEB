import Link from 'next/link';

const LINKS = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <div className="container">
        <nav className="site-nav" aria-label="Navegación principal">
          <Link href="/">
            <strong>Mantenimientos Integrales</strong>
          </Link>
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <Link href="/contacto#cotizar" className="button primary">
            Solicitar cotización
          </Link>
        </nav>
      </div>
    </header>
  );
}
