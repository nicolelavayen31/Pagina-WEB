import { Controller, Get } from '@nestjs/common';
import { LeadStatus, ProjectStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { SessionUser } from '../../common/http/authenticated-request';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  /** Each block is only returned when the user may read that data. */
  @RequirePermissions('project:read')
  @Get()
  async summary(@CurrentUser() user: SessionUser) {
    const grouped = await this.prisma.project.groupBy({ by: ['status'], _count: { _all: true } });
    const projects = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0, total: 0 } satisfies Record<ProjectStatus | 'total', number>;
    for (const row of grouped) {
      projects[row.status] = row._count._all;
      projects.total += row._count._all;
    }

    const leads = user.permissions.includes('lead:read')
      ? {
          total: await this.prisma.lead.count(),
          new: await this.prisma.lead.count({ where: { status: LeadStatus.NEW } }),
        }
      : null;

    const services = user.permissions.includes('service:read')
      ? {
          total: await this.prisma.service.count(),
          active: await this.prisma.service.count({ where: { isActive: true } }),
        }
      : null;

    return { projects, leads, services };
  }
}
