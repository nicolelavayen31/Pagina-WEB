import { Injectable, Logger } from '@nestjs/common';
import type { Page, PageRequest } from '../../../common/application/pagination';
import { paginate } from '../../../common/persistence/paginate';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { AuditEntry, AuditLogger } from '../application/audit-logger';
import type { AuditLogReader, AuditLogView } from '../application/audit-log-reader';

@Injectable()
export class PrismaAuditRepository implements AuditLogger, AuditLogReader {
  private readonly logger = new Logger(PrismaAuditRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async log({ actorId, action, entityType, entityId, metadata }: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: { actorUserId: actorId, action, entityType, entityId, metadata } });
    } catch (error) {
      this.logger.error(`Could not write audit entry ${action} ${entityType}:${entityId}`, (error as Error).stack);
    }
  }

  list(request: PageRequest): Promise<Page<AuditLogView>> {
    return paginate(
      this.prisma,
      request,
      (window) =>
        this.prisma.auditLog.findMany({
          ...window,
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { id: true, name: true, email: true } } },
        }),
      () => this.prisma.auditLog.count(),
    );
  }
}
