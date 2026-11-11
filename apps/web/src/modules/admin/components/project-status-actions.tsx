'use client';

import type { AdminProject } from '@repo/contracts';
import { useCan } from '@/modules/admin/admin-context';

type Props = {
  project: AdminProject;
  busy: boolean;
  run: (path: string, init: RequestInit, success: string) => Promise<string | null>;
  onDelete: () => void;
};

/** Publication buttons; each one is shown only when the user has the permission and the transition applies. */
export function ProjectStatusActions({ project, busy, run, onDelete }: Props) {
  const can = useCan();
  const transition = (action: 'publish' | 'unpublish' | 'archive', success: string) =>
    run(`/admin/projects/${project.id}/${action}`, { method: 'POST' }, success);

  return (
    <>
      {can('project:publish') && project.status !== 'PUBLISHED' ? (
        <button type="button" className="button primary small" disabled={busy}
          onClick={() => transition('publish', 'Proyecto publicado.')}>
          Publicar
        </button>
      ) : null}
      {can('project:unpublish') && project.status === 'PUBLISHED' ? (
        <button type="button" className="button outline small" disabled={busy}
          onClick={() => transition('unpublish', 'Proyecto despublicado.')}>
          Despublicar
        </button>
      ) : null}
      {can('project:archive') && project.status !== 'ARCHIVED' ? (
        <button type="button" className="button outline small" disabled={busy}
          onClick={() => transition('archive', 'Proyecto archivado.')}>
          Archivar
        </button>
      ) : null}
      {can('project:delete') ? (
        <button type="button" className="button danger small" disabled={busy} onClick={onDelete}>
          Eliminar
        </button>
      ) : null}
    </>
  );
}
