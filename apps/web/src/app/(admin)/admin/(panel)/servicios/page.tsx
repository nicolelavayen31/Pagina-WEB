'use client';

import { useState, type FormEvent } from 'react';
import { useCan } from '@/components/admin/admin-context';
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

  if (!can('service:read')) return <p className="alert error">No tiene permiso para ver los servicios.</p>;

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
    <>
      <h1>Servicios</h1>
      <div aria-live="polite">{notice ? <p className={`alert ${notice.kind}`} role="status">{notice.text}</p> : null}</div>
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <p>Cargando…</p> : null}

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
                  <td>
                    <strong>{service.name}</strong>
                    <br />
                    <span className="hint">{service.summary}</span>
                  </td>
                  <td>
                    <span className={`badge ${service.isActive ? 'active' : 'inactive'}`}>{service.isActive ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  {can('service:write') ? (
                    <td>
                      <button type="button" className="button ghost small" onClick={() => toggle(service)}>
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

      {can('service:write') ? (
        <form onSubmit={create} className="card" style={{ padding: 24, marginTop: 24 }}>
          <h2 style={{ margin: 0 }}>Nuevo servicio</h2>
          <div>
            <label htmlFor="service-name">Nombre</label>
            <input id="service-name" name="name" required minLength={2} maxLength={120} />
          </div>
          <div>
            <label htmlFor="service-summary">Resumen</label>
            <input id="service-summary" name="summary" required minLength={10} maxLength={240} />
          </div>
          <div>
            <label htmlFor="service-description">Descripción</label>
            <textarea id="service-description" name="description" rows={3} required minLength={20} maxLength={3000} />
          </div>
          <div>
            <label htmlFor="service-order">Orden</label>
            <input id="service-order" name="sortOrder" type="number" min={0} max={1000} defaultValue={100} />
          </div>
          <button className="button primary" type="submit">Crear servicio</button>
        </form>
      ) : null}
    </>
  );
}
