'use client';

import type { DashboardSummary } from '@repo/contracts';
import { AdminSection, Loading } from '@/modules/admin/components/admin-ui';
import { useApi } from '@/modules/admin/hooks/use-api';


function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function DashboardScreen() {
  const { data, error, loading } = useApi<DashboardSummary>('/admin/dashboard');

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
