import Link from 'next/link';

/* WhatsApp is not repeated here: the floating button is visible on every public page. */
export function SiteFooter() {
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
    </footer>
  );
}
