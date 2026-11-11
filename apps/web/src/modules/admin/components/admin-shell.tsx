'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AuthUser, PermissionName } from '@repo/contracts';
import { AdminUserContext } from '@/modules/admin/admin-context';
import { Avatar, roleLabels } from '@/modules/admin/components/admin-ui';
import { goToLogin, handleAuthError } from '@/modules/admin/hooks/use-api';
import { getCurrentUser, logout as endSession } from '@/modules/auth/api';
import { friendlyMessage } from '@/shared/api/client';

const NAV: Array<{ href: string; label: string; permission: PermissionName }> = [
  { href: '/admin/dashboard', label: 'Resumen', permission: 'project:read' },
  { href: '/admin/proyectos', label: 'Proyectos', permission: 'project:read' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', permission: 'lead:read' },
  { href: '/admin/servicios', label: 'Servicios', permission: 'service:read' },
  { href: '/admin/usuarios', label: 'Usuarios', permission: 'user:manage' },
  { href: '/admin/auditoria', label: 'Auditoría', permission: 'audit:read' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((err) => {
        if (!handleAuthError(err)) setError(friendlyMessage(err));
      });
  }, []);

  async function logout() {
    await endSession().catch(() => undefined);
    goToLogin();
  }

  if (error || !user) {
    return (
      <main className="admin-center">
        <div className="admin-card admin-card--narrow">
          {error ? <p className="alert error">{error}</p> : <p className="hint" aria-busy="true">Cargando…</p>}
        </div>
      </main>
    );
  }

  return (
    <AdminUserContext.Provider value={user}>
      <div className="admin-shell">
        <aside className="admin-sidebar on-dark">
          <Link href="/admin/dashboard" className="admin-brand">
            <span className="brand__mark brand__mark--light" aria-hidden="true">
              MI
            </span>
            <span>
              <strong>Mantenimientos</strong>
              <small>Panel administrativo</small>
            </span>
          </Link>

          <nav aria-label="Secciones del panel" className="admin-nav">
            {NAV.filter((item) => user.permissions.includes(item.permission)).map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="admin-user">
            <div className="admin-user__info">
              <Avatar name={user.name} />
              <span>
                <strong>{user.name}</strong>
                <small>{roleLabels(user.roles)}</small>
              </span>
            </div>
            <button type="button" className="button outline-light small" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </AdminUserContext.Provider>
  );
}
