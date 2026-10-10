import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl, type PublicProject } from '@/lib/api';

export function ProjectCard({ project, headingLevel = 'h3' }: { project: PublicProject; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  const cover = project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];

  return (
    <article className="project-card">
      <div className="project-card__media">
        {cover ? (
          // Served by the API already resized and re-encoded to WebP, so Next does not re-optimise it.
          <Image
            src={mediaUrl(cover.id)}
            alt={cover.altText ?? ''}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
          />
        ) : (
          <span>Sin imagen</span>
        )}
      </div>
      <Heading>
        <Link href={`/proyectos/${project.slug}`} className="project-card__link">
          {project.title}
        </Link>
      </Heading>
      <p>{project.summary}</p>
    </article>
  );
}
