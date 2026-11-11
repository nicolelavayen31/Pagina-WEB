'use client';

import { useState } from 'react';
import { BUDGET_RANGE_LABELS, LEAD_STATUSES, type AdminLead, type LeadStatusName, type Paginated } from '@repo/contracts';
import { useCan } from '@/modules/admin/admin-context';
import { AdminSection, Avatar, Loading, Pager } from '@/modules/admin/components/admin-ui';
import { mutate, useApi } from '@/modules/admin/hooks/use-api';


const STATUS_LABEL: Record<LeadStatusName, string> = {
  NEW: 'Nueva',
  IN_REVIEW: 'En revisión',
  CONTACTED: 'Contactado',
  QUOTED: 'Cotizada',
  CLOSED: 'Cerrada',
};

export function LeadsScreen() {
  const can = useCan();
  const [status, setStatus] = useState<LeadStatusName | ''>('');
  const [page, setPage] = useState(1);
  const query = `/admin/leads?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`;
  const { data, error, loading, reload } = useApi<Paginated<AdminLead>>(can('lead:read') ? query : null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!can('lead:read')) {
    return (
      <AdminSection as="h1" title="Solicitudes de cotización">
        <p className="alert error">No tiene permiso para ver las cotizaciones.</p>
      </AdminSection>
    );
  }

  async function changeStatus(id: string, next: LeadStatusName) {
    const failure = await mutate(`/admin/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    setNotice(failure);
    if (!failure) await reload();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminSection
      as="h1"
      title="Solicitudes de cotización"
      actions={
        <div className="inline-field">
          <label htmlFor="lead-filter">Estado</label>
          <select
            id="lead-filter"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as LeadStatusName | '');
            }}
          >
            <option value="">Todos</option>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {notice ? <p className="alert error" role="alert">{notice}</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <Loading /> : null}

      {data && data.items.length === 0 ? <p className="hint">No hay solicitudes.</p> : null}
      {data && data.items.length > 0 ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Contacto</th>
                <th scope="col">Necesidad</th>
                <th scope="col">Fecha</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <span className="cell-user">
                      <Avatar name={lead.name} />
                      <span>
                        <strong>{lead.name}</strong>
                        {lead.company ? <small>{lead.company}</small> : null}
                        <small>{lead.email}</small>
                        <small>{lead.phone}</small>
                      </span>
                    </span>
                  </td>
                  <td className="cell-wide">
                    <span className="hint">
                      {lead.service?.name ?? 'Sin servicio'} · {lead.location}
                      {lead.budgetRange ? ` · ${BUDGET_RANGE_LABELS[lead.budgetRange]}` : ''}
                    </span>
                    <p className="cell-text">{lead.description}</p>
                  </td>
                  <td>{new Date(lead.createdAt).toLocaleString('es')}</td>
                  <td>
                    {can('lead:update_status') ? (
                      <>
                        <label htmlFor={`status-${lead.id}`} className="sr-only">
                          Estado de la solicitud de {lead.name}
                        </label>
                        <select
                          id={`status-${lead.id}`}
                          className="select-compact"
                          value={lead.status}
                          onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatusName)}
                        >
                          {LEAD_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {STATUS_LABEL[value]}
                            </option>
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

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </AdminSection>
  );
}
