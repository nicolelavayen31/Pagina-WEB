import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, RolesGuard, PermissionsGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
