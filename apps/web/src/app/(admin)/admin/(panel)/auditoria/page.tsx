'use client';

import { useState } from 'react';
import type { Paginated } from '@repo/contracts';
import { useCan } from '@/components/admin/admin-context';
import { useApi } from '@/components/admin/use-api';

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: { name: string; email: string } | null;
};

export default function AuditPage() {
  const can = useCan();
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<Paginated<AuditEntry>>(can('audit:read') ? `/admin/audit?page=${page}&pageSize=50` : null);

  if (!can('audit:read')) return <p className="alert error">No tiene permiso para ver la auditoría.</p>;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <h1>Registro de auditoría</h1>
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <p>Cargando…</p> : null}
      {data ? (
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
                  <td>{entry.actor ? entry.actor.name : 'Sistema'}</td>
                  <td><code>{entry.action}</code></td>
                  <td>
                    {entry.entityType} <span className="hint">{entry.entityId.slice(0, 8)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {totalPages > 1 ? (
        <nav aria-label="Paginación" style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
          <button type="button" className="button ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button type="button" className="button ghost small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
        </nav>
      ) : null}
    </>
  );
}
