import { Module } from '@nestjs/common';
import { GetDashboardSummaryUseCase } from './application/get-dashboard-summary.use-case';
import { DashboardStats } from './application/ports/dashboard-stats';
import { PrismaDashboardStats } from './infrastructure/prisma-dashboard-stats';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [{ provide: DashboardStats, useClass: PrismaDashboardStats }, GetDashboardSummaryUseCase],
})
export class DashboardModule {}
