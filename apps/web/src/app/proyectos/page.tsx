import Link from 'next/link';
import { getPublicProjects } from '@/lib/api';

export default async function ProjectsPage() {
  const projects = await getPublicProjects().catch(() => []);

  return (
    <main className="container section">
      <h1>Proyectos</h1>
      <div className="grid grid-3">
        {projects.map((project) => (
          <article key={project.id} className="card">
            <div style={{ minHeight: 180, background: '#dfeafe', display: 'grid', placeItems: 'center' }}>Imagen</div>
            <div style={{ padding: 20 }}>
              <p style={{ color: '#007AFF', fontWeight: 700 }}>{project.category}</p>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              <Link href={`/proyectos/${project.slug}`} className="button primary">Ver detalle</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
