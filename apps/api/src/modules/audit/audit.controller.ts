import { Controller, Get, Query } from '@nestjs/common';
import { paginationSchema } from '@repo/contracts';
import type { z } from 'zod';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditService } from './audit.service';

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @RequirePermissions('audit:read')
  @Get()
  list(@Query(new ZodValidationPipe(paginationSchema)) query: z.infer<typeof paginationSchema>) {
    return this.audit.list(query.page, query.pageSize);
  }
}
