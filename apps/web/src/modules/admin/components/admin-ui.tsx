import { useId } from 'react';
import type { RoleName } from '@repo/contracts';

export const ROLE_LABEL: Record<RoleName, string> = {
  ADMIN: 'Administrador',
  PROJECT_MANAGER: 'Gestor de proyectos',
};

export function roleLabels(roles: string[]) {
  return roles.map((role) => ROLE_LABEL[role as RoleName] ?? role).join(', ') || 'Sin rol';
}

/** White rounded card with a heading row (title + optional actions). */
export function AdminSection({
  title,
  as = 'h2',
  actions,
  description,
  id,
  children,
}: {
  title: React.ReactNode;
  as?: 'h1' | 'h2';
  actions?: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
  children?: React.ReactNode;
}) {
  const headingId = useId();
  const Heading = as;
  return (
    <section className="admin-card" aria-labelledby={headingId} id={id}>
      <header className="admin-card__head">
        <div>
          <Heading id={headingId}>{title}</Heading>
          {description ? <div className="admin-card__description">{description}</div> : null}
        </div>
        {actions ? <div className="admin-card__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <span className="avatar" aria-hidden="true">
      {initials || '?'}
    </span>
  );
}

export function Notice({ notice }: { notice: { kind: 'success' | 'error'; text: string } | null }) {
  return (
    <div aria-live="polite">
      {notice ? (
        <p className={`alert ${notice.kind}`} role="status">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}

export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="pagination">
      <button type="button" className="button outline small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button type="button" className="button outline small" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}

export function Loading() {
  return (
    <p className="hint" aria-busy="true">
      Cargando…
    </p>
  );
}
