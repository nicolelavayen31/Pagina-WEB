import { Controller, Get } from '@nestjs/common';
import type { SessionUser } from '../../auth/presentation/authenticated-request';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import { GetDashboardSummaryUseCase } from '../application/get-dashboard-summary.use-case';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly getSummary: GetDashboardSummaryUseCase) {}

  @RequirePermissions('project:read')
  @Get()
  summary(@CurrentUser() user: SessionUser) {
    return this.getSummary.execute(user.permissions);
  }
}
