'use client';

import { useState, type FormEvent } from 'react';
import { ROLES, type AdminUser } from '@repo/contracts';
import { useAdminUser, useCan } from '@/modules/admin/admin-context';
import { AdminSection, Avatar, Loading, Notice, ROLE_LABEL, roleLabels } from '@/modules/admin/components/admin-ui';
import { mutate, useApi } from '@/modules/admin/hooks/use-api';


export function UsersScreen() {
  const can = useCan();
  const me = useAdminUser();
  const { data, error, loading, reload } = useApi<AdminUser[]>(can('user:manage') ? '/admin/users' : null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  if (!can('user:manage')) {
    return (
      <AdminSection as="h1" title="Usuarios">
        <p className="alert error">No tiene permiso para gestionar usuarios.</p>
      </AdminSection>
    );
  }

  async function update(id: string, body: object, success: string) {
    const failure = await mutate(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    setNotice(failure ? { kind: 'error', text: failure } : { kind: 'success', text: success });
    if (!failure) await reload();
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const failure = await mutate('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: String(data.get('email') ?? '').trim(),
        name: String(data.get('name') ?? '').trim(),
        password: String(data.get('password') ?? ''),
        roles: [String(data.get('role'))],
      }),
    });
    setNotice(failure ? { kind: 'error', text: failure } : { kind: 'success', text: 'Usuario creado.' });
    if (!failure) {
      form.reset();
      await reload();
    }
  }

  return (
    <div className="page-stack">
      <AdminSection
        as="h1"
        title="Usuarios"
        actions={
          <a href="#nuevo-usuario" className="button primary">
            Nuevo usuario
          </a>
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
                  <th scope="col">Usuario</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Último acceso</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="cell-user">
                        <Avatar name={user.name} />
                        <span>
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                        </span>
                      </span>
                    </td>
                    <td>{roleLabels(user.roles)}</td>
                    <td>
                      <span className={`badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('es') : 'Nunca'}</td>
                    <td>
                      {user.id === me.id ? (
                        <span className="hint">Usted</span>
                      ) : (
                        <button
                          type="button"
                          className="button outline small"
                          onClick={() =>
                            update(user.id, { isActive: !user.isActive }, user.isActive ? 'Usuario desactivado y sesiones cerradas.' : 'Usuario activado.')
                          }
                        >
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminSection>

      <AdminSection title="Nuevo usuario" id="nuevo-usuario">
        <form onSubmit={create} className="form-grid">
          <div>
            <label htmlFor="user-name">Nombre</label>
            <input id="user-name" name="name" required minLength={2} maxLength={120} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="user-email">Correo electrónico</label>
            <input id="user-email" name="email" type="email" required autoComplete="off" />
          </div>
          <div>
            <label htmlFor="user-password">Contraseña inicial</label>
            <input
              id="user-password"
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              aria-describedby="user-password-hint"
            />
            <p className="hint" id="user-password-hint">
              Mínimo 12 caracteres. Compártala por un canal seguro.
            </p>
          </div>
          <div>
            <label htmlFor="user-role">Rol</label>
            <select id="user-role" name="role" defaultValue="PROJECT_MANAGER">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="field--full form-actions">
            <button className="button primary" type="submit">
              Crear usuario
            </button>
          </div>
        </form>
      </AdminSection>
    </div>
  );
}
