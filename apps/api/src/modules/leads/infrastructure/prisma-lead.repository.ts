import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../common/application/pagination';
import { paginate } from '../../../common/persistence/paginate';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { LeadListItem, LeadRepository, LeadView, NewLead } from '../application/ports/lead.repository';
import type { LeadStatus } from '../domain/lead';

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(lead: NewLead): Promise<{ id: string }> {
    return this.prisma.lead.create({ data: lead, select: { id: true } });
  }

  list(request: PageRequest, status?: LeadStatus): Promise<Page<LeadListItem>> {
    const where = status ? { status } : {};
    return paginate(
      this.prisma,
      request,
      (window) =>
        this.prisma.lead.findMany({
          ...window,
          where,
          orderBy: { createdAt: 'desc' },
          include: { service: { select: { id: true, name: true } } },
        }),
      () => this.prisma.lead.count({ where }),
    );
  }

  async findStatus(id: string): Promise<LeadStatus | null> {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { status: true } });
    return lead?.status ?? null;
  }

  updateStatus(id: string, status: LeadStatus): Promise<LeadView> {
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }
}
