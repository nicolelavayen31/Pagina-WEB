'use client';

import { useState, type FormEvent } from 'react';
import { useCan } from '@/components/admin/admin-context';
import { AdminSection, Loading, Notice } from '@/components/admin/admin-ui';
import { slugify } from '@/components/admin/project-form';
import { mutate, useApi } from '@/components/admin/use-api';

type Service = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export default function ServicesAdminPage() {
  const can = useCan();
  const { data, error, loading, reload } = useApi<Service[]>(can('service:read') ? '/admin/services' : null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  if (!can('service:read')) {
    return (
      <AdminSection as="h1" title="Servicios">
        <p className="alert error">No tiene permiso para ver los servicios.</p>
      </AdminSection>
    );
  }

  async function toggle(service: Service) {
    const failure = await mutate(`/admin/services/${service.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    setNotice(failure ? { kind: 'error', text: failure } : null);
    if (!failure) await reload();
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const failure = await mutate('/admin/services', {
      method: 'POST',
      body: JSON.stringify({
        name,
        slug: slugify(name),
        summary: String(data.get('summary') ?? '').trim(),
        description: String(data.get('description') ?? '').trim(),
        sortOrder: Number(data.get('sortOrder') ?? 0),
      }),
    });
    setNotice(failure ? { kind: 'error', text: failure } : { kind: 'success', text: 'Servicio creado.' });
    if (!failure) {
      form.reset();
      await reload();
    }
  }

  return (
    <div className="page-stack">
      <AdminSection
        as="h1"
        title="Servicios"
        actions={
          can('service:write') ? (
            <a href="#nuevo-servicio" className="button primary">
              Nuevo servicio
            </a>
          ) : null
        }
      >
        <Notice notice={notice} />
        {error ? <p className="alert error">{error}</p> : null}
        {loading && !data ? <Loading /> : null}

        {data ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Orden</th>
                  <th scope="col">Servicio</th>
                  <th scope="col">Estado</th>
                  {can('service:write') ? <th scope="col">Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {data.map((service) => (
                  <tr key={service.id}>
                    <td>{service.sortOrder}</td>
                    <td className="cell-wide">
                      <strong>{service.name}</strong>
                      <p className="cell-text hint">{service.summary}</p>
                    </td>
                    <td>
                      <span className={`badge ${service.isActive ? 'active' : 'inactive'}`}>{service.isActive ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    {can('service:write') ? (
                      <td>
                        <button type="button" className="button outline small" onClick={() => toggle(service)}>
                          {service.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminSection>

      {can('service:write') ? (
        <AdminSection title="Nuevo servicio" id="nuevo-servicio">
          <form onSubmit={create} className="form-grid">
            <div>
              <label htmlFor="service-name">Nombre</label>
              <input id="service-name" name="name" required minLength={2} maxLength={120} />
            </div>
            <div>
              <label htmlFor="service-order">Orden</label>
              <input id="service-order" name="sortOrder" type="number" min={0} max={1000} defaultValue={100} />
            </div>
            <div className="field--full">
              <label htmlFor="service-summary">Resumen</label>
              <input id="service-summary" name="summary" required minLength={10} maxLength={240} />
            </div>
            <div className="field--full">
              <label htmlFor="service-description">Descripción</label>
              <textarea id="service-description" name="description" rows={3} required minLength={20} maxLength={3000} />
            </div>
            <div className="field--full form-actions">
              <button className="button primary" type="submit">
                Crear servicio
              </button>
            </div>
          </form>
        </AdminSection>
      ) : null}
    </div>
  );
}
