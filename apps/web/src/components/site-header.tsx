'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CloseIcon, MenuIcon } from './icons';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <div className="site-header__bar">
        <Link href="/" className="brand" onClick={close}>
          <span className="brand__mark" aria-hidden="true">
            MI
          </span>
          <span>Mantenimientos Integrales</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
          <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
        </button>

        <nav id="menu-principal" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Navegación principal">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={isActive(pathname, link.href) ? 'page' : undefined} onClick={close}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="site-nav__actions">
            <Link href="/proyectos" className="button secondary" onClick={close}>
              Ver proyectos
            </Link>
            <Link href="/contacto#cotizar" className="button primary" onClick={close}>
              Solicitar cotización
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
