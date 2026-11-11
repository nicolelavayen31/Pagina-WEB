import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { DashboardStats, ProjectCounts } from '../application/ports/dashboard-stats';

@Injectable()
export class PrismaDashboardStats implements DashboardStats {
  constructor(private readonly prisma: PrismaService) {}

  async projectCounts(): Promise<ProjectCounts> {
    const grouped = await this.prisma.project.groupBy({ by: ['status'], _count: { _all: true } });
    const counts: ProjectCounts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
    for (const row of grouped) {
      counts[row.status] = row._count._all;
    }
    return counts;
  }

  async leadCounts(): Promise<{ total: number; new: number }> {
    const [total, fresh] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: 'NEW' } }),
    ]);
    return { total, new: fresh };
  }

  async serviceCounts(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      this.prisma.service.count(),
      this.prisma.service.count({ where: { isActive: true } }),
    ]);
    return { total, active };
  }
}
