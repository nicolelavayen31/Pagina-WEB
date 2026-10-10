import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProjectsService } from './projects.service';
import { projectCreateSchema, projectUpdateSchema } from '@repo/contracts';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  listPublic() {
    return this.projectsService.listPublic();
  }

  @Get('projects/:slug')
  getPublicBySlug(@Param('slug') slug: string) {
    return this.projectsService.findPublicBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:read')
  @Get('admin/projects')
  listAdmin() {
    return this.projectsService.listAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:write')
  @Post('admin/projects')
  create(@Body() body: unknown, @Req() req: any) {
    const parsed = projectCreateSchema.parse(body);
    return this.projectsService.create(parsed, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:read')
  @Get('admin/projects/:id')
  getAdminById(@Param('id') id: string) {
    return this.projectsService.listAdmin().then((items) => items.find((item) => item.id === id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:write')
  @Patch('admin/projects/:id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: any) {
    const parsed = projectUpdateSchema.parse(body);
    return this.projectsService.update(id, parsed, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:publish')
  @Post('admin/projects/:id/publish')
  publish(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.publish(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:publish')
  @Post('admin/projects/:id/unpublish')
  unpublish(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.unpublish(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Permissions('project:archive')
  @Post('admin/projects/:id/archive')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.archive(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('project:delete')
  @Delete('admin/projects/:id')
  delete(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
