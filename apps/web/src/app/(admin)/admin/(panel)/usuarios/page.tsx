'use client';

import { useState, type FormEvent } from 'react';
import { ROLES, type RoleName } from '@repo/contracts';
import { useAdminUser, useCan } from '@/components/admin/admin-context';
import { mutate, useApi } from '@/components/admin/use-api';

type User = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  roles: RoleName[];
  lastLoginAt: string | null;
};

const ROLE_LABEL: Record<RoleName, string> = { ADMIN: 'Administrador', PROJECT_MANAGER: 'Gestor de proyectos' };

export default function UsersPage() {
  const can = useCan();
  const me = useAdminUser();
  const { data, error, loading, reload } = useApi<User[]>(can('user:manage') ? '/admin/users' : null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  if (!can('user:manage')) return <p className="alert error">No tiene permiso para gestionar usuarios.</p>;

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
    <>
      <h1>Usuarios</h1>
      <div aria-live="polite">{notice ? <p className={`alert ${notice.kind}`} role="status">{notice.text}</p> : null}</div>
      {error ? <p className="alert error">{error}</p> : null}
      {loading && !data ? <p>Cargando…</p> : null}

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
                    <strong>{user.name}</strong>
                    <br />
                    {user.email}
                  </td>
                  <td>{user.roles.map((role) => ROLE_LABEL[role] ?? role).join(', ') || 'Sin rol'}</td>
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
                        className="button ghost small"
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

      <form onSubmit={create} className="card" style={{ padding: 24, marginTop: 24 }}>
        <h2 style={{ margin: 0 }}>Nuevo usuario</h2>
        <div className="split even">
          <div>
            <label htmlFor="user-name">Nombre</label>
            <input id="user-name" name="name" required minLength={2} maxLength={120} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="user-email">Correo electrónico</label>
            <input id="user-email" name="email" type="email" required autoComplete="off" />
          </div>
        </div>
        <div className="split even">
          <div>
            <label htmlFor="user-password">Contraseña inicial</label>
            <input id="user-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
            <p className="hint">Mínimo 12 caracteres. Compártala por un canal seguro.</p>
          </div>
          <div>
            <label htmlFor="user-role">Rol</label>
            <select id="user-role" name="role" defaultValue="PROJECT_MANAGER">
              {ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABEL[role]}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="button primary" type="submit">Crear usuario</button>
      </form>
    </>
  );
}
