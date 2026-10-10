import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand } from '@/components/cta-band';
import { PlainText } from '@/components/plain-text';
import { ApiError, getPublicProjectBySlug, mediaUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

async function loadProject(slug: string) {
  try {
    return await getPublicProjectBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug).catch(() => null);
  return project ? { title: project.title, description: project.summary } : { title: 'Proyecto no encontrado' };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await loadProject(slug);
  const cover = project.images.find((image) => image.id === project.coverImageId) ?? project.images[0];
  const gallery = project.images.filter((image) => image.id !== cover?.id);

  return (
    <main className="page-stack">
      <section className="page-hero on-dark" aria-labelledby="proyecto-titulo">
        <Link href="/proyectos" className="page-hero__back">
          ← Volver a proyectos
        </Link>
        <p className="eyebrow page-hero__eyebrow">
          {project.category} · {project.location}
        </p>
        <h1 id="proyecto-titulo">{project.title}</h1>
        <p>{project.summary}</p>
      </section>

      <section className="surface-section project-detail">
        {cover ? (
          <figure className="project-detail__cover">
            <div className="project-detail__cover-media">
              {/* Served by the API already optimised; drafts never reach this public page. */}
              <Image
                src={mediaUrl(cover.id)}
                alt={cover.altText ?? project.title}
                fill
                unoptimized
                priority
                sizes="(max-width: 1200px) 100vw, 1100px"
              />
            </div>
            {cover.caption ? <figcaption className="hint">{cover.caption}</figcaption> : null}
          </figure>
        ) : null}

        {/* Plain text rendering: any HTML in the description is displayed, never executed. */}
        <PlainText text={project.description} className="prose project-detail__text" />

        {gallery.length > 0 ? (
          <section aria-label="Galería" className="project-gallery">
            {gallery.map((image) => (
              <figure key={image.id}>
                <div className="project-gallery__media">
                  <Image src={mediaUrl(image.id)} alt={image.altText ?? ''} fill unoptimized sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                {image.caption ? <figcaption className="hint">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </section>
        ) : null}
      </section>

      <CtaBand title="¿Tienes un proyecto parecido? Cuéntanos qué necesitas." text="" action="Solicitar cotización" />
    </main>
  );
}
