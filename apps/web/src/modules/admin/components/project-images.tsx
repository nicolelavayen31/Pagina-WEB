'use client';

import type { AdminProject } from '@repo/contracts';
import Image from 'next/image';
import type { FormEvent } from 'react';
import { useCan } from '@/modules/admin/admin-context';
import type { Notice } from '@/modules/admin/hooks/use-project-editor';
import { mediaUrl } from '@/shared/api/client';

const MAX_UPLOAD_MB = 10;

type Props = {
  project: AdminProject;
  busy: boolean;
  run: (path: string, init: RequestInit, success: string) => Promise<string | null>;
  setNotice: (notice: Notice) => void;
};

export function ProjectImages({ project, busy, run, setNotice }: Props) {
  const can = useCan();
  const basePath = `/admin/projects/${project.id}`;

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
    const failure = await run(`${basePath}/images`, { method: 'POST', body: data }, 'Imagen subida.');
    if (!failure) form.reset();
  }

  return (
    <>
      {project.images.length === 0 ? <p className="hint">Sin imágenes.</p> : null}
      <div className="thumbs">
        {project.images.map((image) => (
          <figure key={image.id}>
            <div className="thumbs__media">
              {/* Private image served by the API with the session cookie; not re-optimised by Next. */}
              <Image src={mediaUrl(image.id)} alt={image.altText ?? ''} fill unoptimized sizes="200px" />
              {project.coverImageId === image.id ? <span className="tag thumbs__tag">Portada</span> : null}
            </div>
            <figcaption>
              <span className="hint">
                {image.width}×{image.height}
              </span>
              {can('project:update') && project.coverImageId !== image.id ? (
                <button type="button" className="button outline small" disabled={busy}
                  onClick={() => run(basePath, { method: 'PATCH', body: JSON.stringify({ coverImageId: image.id }) }, 'Portada actualizada.')}>
                  Usar como portada
                </button>
              ) : null}
              {can('media:delete') ? (
                <button type="button" className="button danger small" disabled={busy}
                  onClick={() => run(`${basePath}/images/${image.id}`, { method: 'DELETE' }, 'Imagen eliminada.')}>
                  Eliminar
                </button>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      {can('media:upload') ? (
        <form onSubmit={upload} className="form-grid upload-form">
          <div>
            <label htmlFor="image-file">Nueva imagen (JPEG, PNG o WebP, máx. {MAX_UPLOAD_MB} MB)</label>
            <input id="image-file" type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
          </div>
          <div>
            <label htmlFor="image-alt">Texto alternativo</label>
            <input id="image-alt" name="altText" maxLength={200} placeholder="Describe la imagen para personas con lector de pantalla" />
          </div>
          <div className="field--full form-actions">
            <button className="button primary" type="submit" disabled={busy}>
              Subir imagen
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
