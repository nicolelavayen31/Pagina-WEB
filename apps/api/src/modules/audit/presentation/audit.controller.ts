import { Controller, Get, Query } from '@nestjs/common';
import { paginationSchema } from '@repo/contracts';
import type { PageRequest } from '../../../common/application/pagination';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import { AuditLogReader } from '../application/audit-log-reader';

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditLog: AuditLogReader) {}

  @RequirePermissions('audit:read')
  @Get()
  list(@Query(new ZodValidationPipe(paginationSchema)) query: PageRequest) {
    return this.auditLog.list(query);
  }
}
