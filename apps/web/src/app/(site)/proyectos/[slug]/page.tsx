import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
    <main className="container section">
      <Link href="/proyectos">← Volver a proyectos</Link>
      <p style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 0 }}>
        {project.category} · {project.location}
      </p>
      <h1>{project.title}</h1>
      <p>{project.summary}</p>

      {cover ? (
        <figure style={{ margin: '24px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- served by the API with its own cache headers */}
          <img
            src={mediaUrl(cover.id)}
            alt={cover.altText ?? project.title}
            style={{ width: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 18 }}
          />
          {cover.caption ? <figcaption className="hint">{cover.caption}</figcaption> : null}
        </figure>
      ) : null}

      {/* Plain text rendering: any HTML in the description is displayed, never executed. */}
      <PlainText text={project.description} className="prose" />

      {gallery.length > 0 ? (
        <section aria-label="Galería" className="thumbs" style={{ marginTop: 32 }}>
          {gallery.map((image) => (
            <figure key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- served by the API with its own cache headers */}
              <img src={mediaUrl(image.id)} alt={image.altText ?? ''} loading="lazy" />
              {image.caption ? <figcaption>{image.caption}</figcaption> : null}
            </figure>
          ))}
        </section>
      ) : null}
    </main>
  );
}
