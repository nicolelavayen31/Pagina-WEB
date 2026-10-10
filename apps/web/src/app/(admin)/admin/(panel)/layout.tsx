'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AuthUser, PermissionName } from '@repo/contracts';
import { AdminUserContext } from '@/components/admin/admin-context';
import { goToLogin, handleAuthError } from '@/components/admin/use-api';
import { apiFetch, friendlyMessage } from '@/lib/api';

const NAV: Array<{ href: string; label: string; permission: PermissionName }> = [
  { href: '/admin/dashboard', label: 'Resumen', permission: 'project:read' },
  { href: '/admin/proyectos', label: 'Proyectos', permission: 'project:read' },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', permission: 'lead:read' },
  { href: '/admin/servicios', label: 'Servicios', permission: 'service:read' },
  { href: '/admin/usuarios', label: 'Usuarios', permission: 'user:manage' },
  { href: '/admin/auditoria', label: 'Auditoría', permission: 'audit:read' },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AuthUser>('/auth/me')
      .then(setUser)
      .catch((err) => {
        if (!handleAuthError(err)) setError(friendlyMessage(err));
      });
  }, []);

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    goToLogin();
  }

  if (error) {
    return (
      <main className="container section">
        <p className="alert error">{error}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container section" aria-busy="true">
        <p>Cargando…</p>
      </main>
    );
  }

  return (
    <AdminUserContext.Provider value={user}>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <strong>Panel administrativo</strong>
          <nav aria-label="Secciones del panel">
            {NAV.filter((item) => user.permissions.includes(item.permission)).map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="hint" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {user.name}
            <br />
            {user.roles.join(', ') || 'Sin rol'}
          </p>
          <button type="button" className="button ghost small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={logout}>
            Cerrar sesión
          </button>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </AdminUserContext.Provider>
  );
}
