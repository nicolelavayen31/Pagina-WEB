import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProjectBySlug } from '@/lib/api';

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug).catch(() => null);

  if (!project) {
    notFound();
  }

  return (
    <main className="container section">
      <Link href="/proyectos">Volver a proyectos</Link>
      <h1>{project.title}</h1>
      <p>{project.summary}</p>
      <div style={{ background: '#dfeafe', minHeight: 260, display: 'grid', placeItems: 'center' }}>Portada del proyecto</div>
      <div style={{ marginTop: 24 }} dangerouslySetInnerHTML={{ __html: project.description }} />
    </main>
  );
}
