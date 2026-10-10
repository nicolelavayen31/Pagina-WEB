import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PRIVACY_NOTICE_VERSION, type LeadInput } from '@repo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Fields are mapped one by one: nothing from the request reaches Prisma unchecked. */
  async create(input: LeadInput) {
    if (input.serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: input.serviceId, isActive: true },
        select: { id: true },
      });
      if (!service) {
        throw new BadRequestException({ statusCode: 400, message: 'El servicio seleccionado no existe' });
      }
    }

    return this.prisma.lead.create({
      data: {
        name: input.name,
        company: input.company ? input.company : null,
        email: input.email.toLowerCase(),
        phone: input.phone,
        serviceId: input.serviceId ?? null,
        location: input.location,
        description: input.description,
        budgetRange: input.budgetRange ?? null,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        consentAt: new Date(),
      },
      select: { id: true },
    });
  }

  async list(page: number, pageSize: number, status?: LeadStatus) {
    const where = status ? { status } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { service: { select: { id: true, name: true } } },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async updateStatus(id: string, status: LeadStatus, actorId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!lead) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const updated = await this.prisma.lead.update({ where: { id }, data: { status } });
    await this.audit.log(actorId, 'lead.status_changed', 'Lead', id, { from: lead.status, to: status });
    return updated;
  }
}
