import Link from 'next/link';
import { mediaUrl, type PublicProject } from '@/lib/api';

export function ProjectCard({ project, headingLevel = 'h3' }: { project: PublicProject; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  const cover = project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];

  return (
    <article className="card">
      <div className="card-media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by the API with its own cache headers
          <img src={mediaUrl(cover.id)} alt={cover.altText ?? project.title} loading="lazy" />
        ) : (
          <span>Sin imagen</span>
        )}
      </div>
      <div style={{ padding: 20 }}>
        <p style={{ color: 'var(--primary)', fontWeight: 700, margin: 0 }}>{project.category}</p>
        <Heading>{project.title}</Heading>
        <p>{project.summary}</p>
        <Link href={`/proyectos/${project.slug}`} className="button primary">
          Ver proyecto
        </Link>
      </div>
    </article>
  );
}
