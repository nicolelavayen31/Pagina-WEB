'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Paginated } from '@repo/contracts';
import { useCan } from '@/components/admin/admin-context';
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
    <>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>Proyectos</h1>
        {can('project:create') ? (
          <Link href="/admin/proyectos/nuevo" className="button primary">
            Nuevo proyecto
          </Link>
        ) : null}
      </div>

      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <p>Cargando…</p> : null}

      {data ? (
        data.items.length === 0 ? (
          <p>Todavía no hay proyectos.</p>
        ) : (
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
                      <Link href={`/admin/proyectos/${project.id}`} className="underline">
                        {project.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${project.status}`}>{STATUS_LABEL[project.status]}</span>
                    </td>
                    <td>{project.creator.name}</td>
                    <td>{new Date(project.updatedAt).toLocaleString('es')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {totalPages > 1 ? (
        <nav aria-label="Paginación" style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
          <button type="button" className="button ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button type="button" className="button ghost small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </button>
        </nav>
      ) : null}
    </>
  );
}
