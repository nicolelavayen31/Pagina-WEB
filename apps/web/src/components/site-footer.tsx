import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>© {new Date().getFullYear()} Mantenimientos Integrales y Construcciones</p>
        <nav aria-label="Enlaces legales">
          <Link href="/privacidad">Política de privacidad</Link>
          <Link href="/terminos">Términos y condiciones</Link>
        </nav>
      </div>
    </footer>
  );
}
