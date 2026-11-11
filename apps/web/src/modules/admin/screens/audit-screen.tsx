'use client';

import { useState } from 'react';
import type { AuditEntry, Paginated } from '@repo/contracts';
import { useCan } from '@/modules/admin/admin-context';
import { AdminSection, Avatar, Loading, Pager } from '@/modules/admin/components/admin-ui';
import { useApi } from '@/modules/admin/hooks/use-api';


export function AuditScreen() {
  const can = useCan();
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<Paginated<AuditEntry>>(can('audit:read') ? `/admin/audit?page=${page}&pageSize=50` : null);

  if (!can('audit:read')) {
    return (
      <AdminSection as="h1" title="Registro de auditoría">
        <p className="alert error">No tiene permiso para ver la auditoría.</p>
      </AdminSection>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminSection as="h1" title="Registro de auditoría">
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <Loading /> : null}
      {data && data.items.length === 0 ? <p className="hint">Sin actividad registrada.</p> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Usuario</th>
                <th scope="col">Acción</th>
                <th scope="col">Entidad</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString('es')}</td>
                  <td>
                    <span className="cell-user">
                      <Avatar name={entry.actor ? entry.actor.name : 'Sistema'} />
                      {entry.actor ? entry.actor.name : 'Sistema'}
                    </span>
                  </td>
                  <td>
                    <code className="code-tag">{entry.action}</code>
                  </td>
                  <td>
                    {entry.entityType} <span className="hint">{entry.entityId.slice(0, 8)}</span>
                  </td>
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
