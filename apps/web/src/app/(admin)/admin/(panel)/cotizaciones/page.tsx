'use client';

import { useState } from 'react';
import { BUDGET_RANGE_LABELS, LEAD_STATUSES, type BudgetRange, type LeadStatusName, type Paginated } from '@repo/contracts';
import { useCan } from '@/components/admin/admin-context';
import { mutate, useApi } from '@/components/admin/use-api';

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  location: string;
  description: string;
  budgetRange: BudgetRange | null;
  status: LeadStatusName;
  createdAt: string;
  service: { name: string } | null;
};

const STATUS_LABEL: Record<LeadStatusName, string> = {
  NEW: 'Nueva',
  IN_REVIEW: 'En revisión',
  CONTACTED: 'Contactado',
  QUOTED: 'Cotizada',
  CLOSED: 'Cerrada',
};

export default function LeadsPage() {
  const can = useCan();
  const [status, setStatus] = useState<LeadStatusName | ''>('');
  const [page, setPage] = useState(1);
  const query = `/admin/leads?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`;
  const { data, error, loading, reload } = useApi<Paginated<Lead>>(can('lead:read') ? query : null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!can('lead:read')) return <p className="alert error">No tiene permiso para ver las cotizaciones.</p>;

  async function changeStatus(id: string, next: LeadStatusName) {
    const failure = await mutate(`/admin/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    setNotice(failure);
    if (!failure) await reload();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>Solicitudes de cotización</h1>
        <div>
          <label htmlFor="lead-filter" className="sr-only">Filtrar por estado</label>
          <select id="lead-filter" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as LeadStatusName | ''); }}>
            <option value="">Todos los estados</option>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>{STATUS_LABEL[value]}</option>
            ))}
          </select>
        </div>
      </div>

      {notice ? <p className="alert error" role="alert">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <p>Cargando…</p> : null}

      {data && data.items.length === 0 ? <p>No hay solicitudes.</p> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Contacto</th>
                <th scope="col">Necesidad</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead) => (
                <tr key={lead.id}>
                  <td>{new Date(lead.createdAt).toLocaleString('es')}</td>
                  <td>
                    <strong>{lead.name}</strong>
                    {lead.company ? <> · {lead.company}</> : null}
                    <br />
                    {lead.email}
                    <br />
                    {lead.phone}
                  </td>
                  <td style={{ maxWidth: 420 }}>
                    <span className="hint">
                      {lead.service?.name ?? 'Sin servicio'} · {lead.location}
                      {lead.budgetRange ? ` · ${BUDGET_RANGE_LABELS[lead.budgetRange]}` : ''}
                    </span>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>{lead.description}</p>
                  </td>
                  <td>
                    {can('lead:update_status') ? (
                      <>
                        <label htmlFor={`status-${lead.id}`} className="sr-only">Estado de la solicitud de {lead.name}</label>
                        <select id={`status-${lead.id}`} value={lead.status} onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatusName)}>
                          {LEAD_STATUSES.map((value) => (
                            <option key={value} value={value}>{STATUS_LABEL[value]}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <span className="badge">{STATUS_LABEL[lead.status]}</span>
                    )}
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
