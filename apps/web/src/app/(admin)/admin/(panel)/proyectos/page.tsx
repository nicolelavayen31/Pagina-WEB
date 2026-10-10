'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Paginated } from '@repo/contracts';
import { useCan } from '@/components/admin/admin-context';
import { AdminSection, Avatar, Loading, Pager } from '@/components/admin/admin-ui';
import { useApi } from '@/components/admin/use-api';

type AdminProject = {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  updatedAt: string;
  creator: { name: string };
};

const STATUS_LABEL = { DRAFT: 'Borrador', PUBLISHED: 'Publicado', ARCHIVED: 'Archivado' } as const;

export default function AdminProjectsPage() {
  const can = useCan();
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<Paginated<AdminProject>>(`/admin/projects?page=${page}&pageSize=20`);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminSection
      as="h1"
      title="Proyectos"
      actions={
        can('project:create') ? (
          <Link href="/admin/proyectos/nuevo" className="button primary">
            Nuevo proyecto
          </Link>
        ) : null
      }
    >
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <Loading /> : null}

      {data && data.items.length === 0 ? <p className="hint">Todavía no hay proyectos.</p> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Estado</th>
                <th scope="col">Autor</th>
                <th scope="col">Última modificación</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/admin/proyectos/${project.id}`} className="table-link">
                      {project.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${project.status}`}>{STATUS_LABEL[project.status]}</span>
                  </td>
                  <td>
                    <span className="cell-user">
                      <Avatar name={project.creator.name} />
                      {project.creator.name}
                    </span>
                  </td>
                  <td>{new Date(project.updatedAt).toLocaleString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </AdminSection>
  );
}
