import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl, type PublicProject } from '@/lib/api';

type Props = {
  project: PublicProject;
  headingLevel?: 'h2' | 'h3';
  /** compact: home page. detailed: catalogue card with category tag and data row. */
  variant?: 'compact' | 'detailed';
};

export function ProjectCard({ project, headingLevel = 'h3', variant = 'compact' }: Props) {
  const Heading = headingLevel;
  const cover = project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];
  const year = project.publishedAt ? new Date(project.publishedAt).getFullYear() : null;
  const detailed = variant === 'detailed';

  return (
    <article className={`project-card${detailed ? ' project-card--detailed' : ''}`}>
      <div className="project-card__media">
        {cover ? (
          // Served by the API already resized and re-encoded to WebP, so Next does not re-optimise it.
          <Image
            src={mediaUrl(cover.id)}
            alt={cover.altText ?? ''}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 25vw"
          />
        ) : (
          <span>Sin imagen</span>
        )}
        {detailed ? <span className="tag project-card__tag">{project.category}</span> : null}
      </div>
      <div className="project-card__body">
        <Heading>
          <Link href={`/proyectos/${project.slug}`} className="project-card__link">
            {project.title}
          </Link>
        </Heading>
        <p>{project.summary}</p>
        {detailed ? (
          <dl className="project-card__meta">
            <div>
              <dt className="sr-only">Ubicación</dt>
              <dd>{project.location}</dd>
            </div>
            {year ? (
              <div>
                <dt className="sr-only">Año</dt>
                <dd>{year}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
