'use client';

import { useApi } from '@/components/admin/use-api';

type Summary = {
  projects: { DRAFT: number; PUBLISHED: number; ARCHIVED: number; total: number };
  leads: { total: number; new: number } | null;
  services: { total: number; active: number } | null;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, loading } = useApi<Summary>('/admin/dashboard');

  return (
    <>
      <h1>Resumen</h1>
      {loading && !data ? <p>Cargando…</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
      {data ? (
        <div className="grid grid-3" data-testid="dashboard-stats">
          <Stat label="Total proyectos" value={data.projects.total} />
          <Stat label="Publicados" value={data.projects.PUBLISHED} />
          <Stat label="Borradores" value={data.projects.DRAFT} />
          <Stat label="Archivados" value={data.projects.ARCHIVED} />
          {data.leads ? <Stat label="Solicitudes nuevas" value={data.leads.new} /> : null}
          {data.leads ? <Stat label="Solicitudes totales" value={data.leads.total} /> : null}
          {data.services ? <Stat label="Servicios activos" value={data.services.active} /> : null}
        </div>
      ) : null}
    </>
  );
}
