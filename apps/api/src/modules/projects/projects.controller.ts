import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  paginationSchema,
  projectAuthorSchema,
  projectCreateSchema,
  projectUpdateSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '@repo/contracts';
import type { z } from 'zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { SessionUser } from '../../common/http/authenticated-request';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ProjectsService } from './projects.service';

type Pagination = z.infer<typeof paginationSchema>;

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  listPublic(@Query(new ZodValidationPipe(paginationSchema)) query: Pagination) {
    return this.projectsService.listPublic(query.page, query.pageSize);
  }

  @Get('projects/:slug')
  getPublicBySlug(@Param('slug') slug: string) {
    return this.projectsService.findPublicBySlug(slug);
  }

  @RequirePermissions('project:read')
  @Get('admin/projects')
  listAdmin(@Query(new ZodValidationPipe(paginationSchema)) query: Pagination) {
    return this.projectsService.listAdmin(query.page, query.pageSize);
  }

  @RequirePermissions('project:read')
  @Get('admin/projects/:id')
  getAdminById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findAdminById(id);
  }

  @RequirePermissions('project:create')
  @Post('admin/projects')
  create(
    @Body(new ZodValidationPipe(projectCreateSchema)) body: ProjectCreateInput,
    @CurrentUser() user: SessionUser,
  ) {
    return this.projectsService.create(body, user.id);
  }

  @RequirePermissions('project:update')
  @Patch('admin/projects/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(projectUpdateSchema)) body: ProjectUpdateInput,
    @CurrentUser() user: SessionUser,
  ) {
    return this.projectsService.update(id, body, user.id);
  }

  @RequirePermissions('project:publish')
  @Post('admin/projects/:id/publish')
  publish(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: SessionUser) {
    return this.projectsService.publish(id, user.id);
  }

  @RequirePermissions('project:unpublish')
  @Post('admin/projects/:id/unpublish')
  unpublish(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: SessionUser) {
    return this.projectsService.unpublish(id, user.id);
  }

  @RequirePermissions('project:archive')
  @Post('admin/projects/:id/archive')
  archive(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: SessionUser) {
    return this.projectsService.archive(id, user.id);
  }

  @RequirePermissions('project:assign_author')
  @Patch('admin/projects/:id/author')
  assignAuthor(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(projectAuthorSchema)) body: z.infer<typeof projectAuthorSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.projectsService.assignAuthor(id, body.userId, user.id);
  }

  @RequirePermissions('project:delete')
  @Delete('admin/projects/:id')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: SessionUser) {
    return this.projectsService.remove(id, user.id);
  }
}
