import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ServiceCreateInput, ServiceUpdateInput } from '@repo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const publicServiceSelect = {
  id: true,
  name: true,
  slug: true,
  summary: true,
  description: true,
} satisfies Prisma.ServiceSelect;

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPublic() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: publicServiceSelect,
    });
  }

  async findPublicBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isActive: true },
      select: publicServiceSelect,
    });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  listAdmin() {
    return this.prisma.service.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async create(input: ServiceCreateInput, actorId: string) {
    const service = await this.prisma.service.create({ data: input });
    await this.audit.log(actorId, 'service.created', 'Service', service.id);
    return service;
  }

  async update(id: string, input: ServiceUpdateInput, actorId: string) {
    const exists = await this.prisma.service.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Servicio no encontrado');
    }
    const service = await this.prisma.service.update({ where: { id }, data: input });
    await this.audit.log(actorId, 'service.updated', 'Service', id, { fields: Object.keys(input) });
    return service;
  }
}
