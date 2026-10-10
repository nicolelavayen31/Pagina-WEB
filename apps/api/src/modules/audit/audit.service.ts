import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Audit failures are logged but never break the operation being audited. */
  async log(
    actorUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: { actorUserId, action, entityType, entityId, metadata } });
    } catch (error) {
      this.logger.error(`Could not write audit entry ${action} ${entityType}:${entityId}`, (error as Error).stack);
    }
  }

  async list(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, pageSize };
  }
}
