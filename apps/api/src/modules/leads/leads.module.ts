import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, RolesGuard, PermissionsGuard],
})
export class LeadsModule {}
