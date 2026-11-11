'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCan } from '@/modules/admin/admin-context';
import { AdminSection, Loading, Notice } from '@/modules/admin/components/admin-ui';
import { ProjectForm } from '@/modules/admin/components/project-form';
import { ProjectImages } from '@/modules/admin/components/project-images';
import { ProjectStatusActions } from '@/modules/admin/components/project-status-actions';
import { useProjectEditor } from '@/modules/admin/hooks/use-project-editor';

const STATUS_LABEL = { DRAFT: 'Borrador', PUBLISHED: 'Publicado', ARCHIVED: 'Archivado' } as const;

export function EditProjectScreen() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const { project, error, loading, notice, setNotice, busy, run, remove } = useProjectEditor(id);

  if (loading && !project) return <Loading />;
  if (error) return <p className="alert error">{error}</p>;
  if (!project) return null;

  return (
    <div className="page-stack">
      <p className="admin-back">
        <Link href="/admin/proyectos">← Proyectos</Link>
      </p>

      <AdminSection
        as="h1"
        title={project.title}
        actions={<ProjectStatusActions project={project} busy={busy} run={run} onDelete={remove} />}
        description={
          <>
            <span className={`badge ${project.status}`} data-testid="project-status">
              {STATUS_LABEL[project.status]}
            </span>{' '}
            · Autor: {project.creator.name}
            {project.status === 'PUBLISHED' ? (
              <>
                {' · '}
                <Link className="table-link" href={`/proyectos/${project.slug}`} target="_blank">
                  Ver en el sitio
                </Link>
              </>
            ) : null}
          </>
        }
      >
        <Notice notice={notice} />
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
      </AdminSection>

      <AdminSection title="Imágenes">
        <ProjectImages project={project} busy={busy} run={run} setNotice={setNotice} />
      </AdminSection>
    </div>
  );
}
