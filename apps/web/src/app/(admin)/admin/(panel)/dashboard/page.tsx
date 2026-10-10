'use client';

import { AdminSection, Loading } from '@/components/admin/admin-ui';
import { useApi } from '@/components/admin/use-api';

type Summary = {
  projects: { DRAFT: number; PUBLISHED: number; ARCHIVED: number; total: number };
  leads: { total: number; new: number } | null;
  services: { total: number; active: number } | null;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, loading } = useApi<Summary>('/admin/dashboard');

  return (
    <AdminSection as="h1" title="Resumen">
      {loading && !data ? <Loading /> : null}
      {error ? <p className="alert error">{error}</p> : null}
      {data ? (
        <div className="stat-grid" data-testid="dashboard-stats">
          <Stat label="Total proyectos" value={data.projects.total} />
          <Stat label="Publicados" value={data.projects.PUBLISHED} />
          <Stat label="Borradores" value={data.projects.DRAFT} />
          <Stat label="Archivados" value={data.projects.ARCHIVED} />
          {data.leads ? <Stat label="Solicitudes nuevas" value={data.leads.new} /> : null}
          {data.leads ? <Stat label="Solicitudes totales" value={data.leads.total} /> : null}
          {data.services ? <Stat label="Servicios activos" value={data.services.active} /> : null}
        </div>
      ) : null}
    </AdminSection>
  );
}
