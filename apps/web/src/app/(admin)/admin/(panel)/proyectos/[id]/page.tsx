'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useCan } from '@/components/admin/admin-context';
import { ProjectForm, type ProjectFields } from '@/components/admin/project-form';
import { mutate, useApi } from '@/components/admin/use-api';
import { mediaUrl } from '@/lib/api';

type AdminProject = ProjectFields & {
  id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  coverImageId: string | null;
  creator: { name: string; email: string };
  images: Array<{ id: string; altText: string | null; caption: string | null; width: number; height: number }>;
};

const STATUS_LABEL = { DRAFT: 'Borrador', PUBLISHED: 'Publicado', ARCHIVED: 'Archivado' } as const;
const MAX_UPLOAD_MB = 10;

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const can = useCan();
  const { data: project, error, loading, reload } = useApi<AdminProject>(`/admin/projects/${id}`);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(path: string, init: RequestInit, success: string) {
    setBusy(true);
    setNotice(null);
    const failure = await mutate(path, init);
    setNotice(failure ? { kind: 'error', text: failure } : { kind: 'success', text: success });
    setBusy(false);
    if (!failure) await reload();
    return failure;
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setNotice({ kind: 'error', text: 'Seleccione una imagen.' });
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setNotice({ kind: 'error', text: `La imagen supera ${MAX_UPLOAD_MB} MB.` });
      return;
    }
    if (!String(data.get('altText') ?? '').trim()) data.delete('altText');
    const failure = await run(`/admin/projects/${id}/images`, { method: 'POST', body: data }, 'Imagen subida.');
    if (!failure) form.reset();
  }

  async function remove() {
    if (!window.confirm('¿Eliminar definitivamente este proyecto y sus imágenes?')) return;
    const failure = await mutate(`/admin/projects/${id}`, { method: 'DELETE' });
    if (failure) setNotice({ kind: 'error', text: failure });
    else router.push('/admin/proyectos');
  }

  if (loading && !project) return <p>Cargando…</p>;
  if (error) return <p className="alert error">{error}</p>;
  if (!project) return null;

  return (
    <>
      <p>
        <Link href="/admin/proyectos">← Proyectos</Link>
      </p>
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>{project.title}</h1>
          <p className="hint" style={{ margin: '4px 0 0' }}>
            <span className={`badge ${project.status}`} data-testid="project-status">
              {STATUS_LABEL[project.status]}
            </span>{' '}
            · Autor: {project.creator.name}
            {project.status === 'PUBLISHED' ? (
              <>
                {' · '}
                <Link className="underline" href={`/proyectos/${project.slug}`} target="_blank">
                  Ver en el sitio
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {can('project:publish') && project.status !== 'PUBLISHED' ? (
            <button type="button" className="button primary small" disabled={busy}
              onClick={() => run(`/admin/projects/${id}/publish`, { method: 'POST' }, 'Proyecto publicado.')}>
              Publicar
            </button>
          ) : null}
          {can('project:unpublish') && project.status === 'PUBLISHED' ? (
            <button type="button" className="button ghost small" disabled={busy}
              onClick={() => run(`/admin/projects/${id}/unpublish`, { method: 'POST' }, 'Proyecto despublicado.')}>
              Despublicar
            </button>
          ) : null}
          {can('project:archive') && project.status !== 'ARCHIVED' ? (
            <button type="button" className="button ghost small" disabled={busy}
              onClick={() => run(`/admin/projects/${id}/archive`, { method: 'POST' }, 'Proyecto archivado.')}>
              Archivar
            </button>
          ) : null}
          {can('project:delete') ? (
            <button type="button" className="button danger small" disabled={busy} onClick={remove}>
              Eliminar
            </button>
          ) : null}
        </div>
      </div>

      <div aria-live="polite">
        {notice ? <p className={`alert ${notice.kind}`} role="status">{notice.text}</p> : null}
      </div>

      {!can('project:publish') && project.status !== 'PUBLISHED' ? (
        <p className="hint">La publicación la realiza un administrador.</p>
      ) : null}

      {can('project:update') ? (
        <ProjectForm
          key={project.id}
          initial={{
            title: project.title,
            slug: project.slug,
            summary: project.summary,
            description: project.description,
            category: project.category,
            location: project.location,
          }}
          submitLabel="Guardar cambios"
          onSubmit={(fields) => run(`/admin/projects/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }, 'Cambios guardados.')}
        />
      ) : null}

      <section style={{ marginTop: 32 }} aria-labelledby="imagenes-titulo">
        <h2 id="imagenes-titulo">Imágenes</h2>
        {project.images.length === 0 ? <p>Sin imágenes.</p> : null}
        <div className="thumbs">
          {project.images.map((image) => (
            <figure key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- private image served by the API */}
              <img src={mediaUrl(image.id)} alt={image.altText ?? ''} />
              <figcaption>
                <span>
                  {image.width}×{image.height}
                  {project.coverImageId === image.id ? ' · Portada' : ''}
                </span>
                {can('project:update') && project.coverImageId !== image.id ? (
                  <button type="button" className="button ghost small" disabled={busy}
                    onClick={() => run(`/admin/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ coverImageId: image.id }) }, 'Portada actualizada.')}>
                    Usar como portada
                  </button>
                ) : null}
                {can('media:delete') ? (
                  <button type="button" className="button danger small" disabled={busy}
                    onClick={() => run(`/admin/projects/${id}/images/${image.id}`, { method: 'DELETE' }, 'Imagen eliminada.')}>
                    Eliminar
                  </button>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>

        {can('media:upload') ? (
          <form onSubmit={upload} className="card" style={{ padding: 24, marginTop: 16 }}>
            <div>
              <label htmlFor="image-file">Nueva imagen (JPEG, PNG o WebP, máx. {MAX_UPLOAD_MB} MB)</label>
              <input id="image-file" type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
            </div>
            <div>
              <label htmlFor="image-alt">Texto alternativo</label>
              <input id="image-alt" name="altText" maxLength={200} placeholder="Describe la imagen para personas con lector de pantalla" />
            </div>
            <button className="button primary" type="submit" disabled={busy}>
              Subir imagen
            </button>
          </form>
        ) : null}
      </section>
    </>
  );
}
