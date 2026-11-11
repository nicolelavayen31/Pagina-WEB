import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type {
  PublicServiceView,
  ServiceDetails,
  ServiceRepository,
  ServiceView,
} from '../application/ports/service.repository';

const publicServiceSelect = {
  id: true,
  name: true,
  slug: true,
  summary: true,
  description: true,
} satisfies Prisma.ServiceSelect;

const displayOrder = [{ sortOrder: 'asc' }, { name: 'asc' }] satisfies Prisma.ServiceOrderByWithRelationInput[];

const activeServices = { isActive: true } satisfies Prisma.ServiceWhereInput;

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActive(): Promise<PublicServiceView[]> {
    return this.prisma.service.findMany({ where: activeServices, orderBy: displayOrder, select: publicServiceSelect });
  }

  findActiveBySlug(slug: string): Promise<PublicServiceView | null> {
    return this.prisma.service.findFirst({ where: { ...activeServices, slug }, select: publicServiceSelect });
  }

  async isActive(id: string): Promise<boolean> {
    return (await this.prisma.service.findFirst({ where: { ...activeServices, id }, select: { id: true } })) !== null;
  }

  listAll(): Promise<ServiceView[]> {
    return this.prisma.service.findMany({ orderBy: displayOrder });
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prisma.service.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  create(details: ServiceDetails): Promise<ServiceView> {
    return this.prisma.service.create({ data: details });
  }

  update(id: string, changes: Partial<ServiceDetails>): Promise<ServiceView> {
    return this.prisma.service.update({ where: { id }, data: changes });
  }
}
