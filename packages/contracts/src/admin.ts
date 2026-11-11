import type { ProjectStatusName } from './projects';

/** Row of `GET /admin/audit`. */
export type AuditEntry = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

/** Response of `GET /admin/dashboard`; blocks the user may not read are `null`. */
export type DashboardSummary = {
  projects: Record<ProjectStatusName, number> & { total: number };
  leads: { total: number; new: number } | null;
  services: { total: number; active: number } | null;
};
