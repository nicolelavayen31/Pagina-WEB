import { Global, Module } from '@nestjs/common';
import { AuditLogReader } from './application/audit-log-reader';
import { AuditLogger } from './application/audit-logger';
import { PrismaAuditRepository } from './infrastructure/prisma-audit.repository';
import { AuditController } from './presentation/audit.controller';

@Global()
@Module({
  controllers: [AuditController],
  providers: [
    PrismaAuditRepository,
    { provide: AuditLogger, useExisting: PrismaAuditRepository },
    { provide: AuditLogReader, useExisting: PrismaAuditRepository },
  ],
  exports: [AuditLogger],
})
export class AuditModule {}
