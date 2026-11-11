import { Injectable } from '@nestjs/common';
import { DashboardStats, type ProjectCounts } from './ports/dashboard-stats';

export type DashboardSummary = {
  projects: ProjectCounts & { total: number };
  leads: { total: number; new: number } | null;
  services: { total: number; active: number } | null;
};

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(private readonly stats: DashboardStats) {}

  /** Each block is only computed when the user may read that data; otherwise it is `null`. */
  async execute(permissions: readonly string[]): Promise<DashboardSummary> {
    const can = (permission: string) => permissions.includes(permission);

    const [projectCounts, leads, services] = await Promise.all([
      this.stats.projectCounts(),
      can('lead:read') ? this.stats.leadCounts() : null,
      can('service:read') ? this.stats.serviceCounts() : null,
    ]);

    const total = Object.values(projectCounts).reduce((sum, count) => sum + count, 0);
    return { projects: { ...projectCounts, total }, leads, services };
  }
}
