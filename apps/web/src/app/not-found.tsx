import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container section">
      <h1>404</h1>
      <p>La página que buscas no existe o ya no está disponible.</p>
      <Link href="/" className="button primary">Volver al inicio</Link>
    </main>
  );
}
