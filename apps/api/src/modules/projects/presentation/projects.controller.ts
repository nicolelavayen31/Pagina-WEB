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
import type { PageRequest } from '../../../common/application/pagination';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import type { SessionUser } from '../../auth/presentation/authenticated-request';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import { ProjectQueries } from '../application/project.queries';
import { AssignProjectAuthorUseCase } from '../application/use-cases/assign-project-author.use-case';
import { ChangeProjectStatusUseCase } from '../application/use-cases/change-project-status.use-case';
import { CreateProjectUseCase } from '../application/use-cases/create-project.use-case';
import { DeleteProjectUseCase } from '../application/use-cases/delete-project.use-case';
import { UpdateProjectUseCase } from '../application/use-cases/update-project.use-case';

const paginationPipe = new ZodValidationPipe(paginationSchema);
const uuidPipe = new ParseUUIDPipe();

@Controller()
export class ProjectsController {
  constructor(
    private readonly queries: ProjectQueries,
    private readonly createProject: CreateProjectUseCase,
    private readonly updateProject: UpdateProjectUseCase,
    private readonly changeStatus: ChangeProjectStatusUseCase,
    private readonly assignProjectAuthor: AssignProjectAuthorUseCase,
    private readonly deleteProject: DeleteProjectUseCase,
  ) {}

  @Get('projects')
  listPublic(@Query(paginationPipe) query: PageRequest) {
    return this.queries.listPublished(query);
  }

  @Get('projects/:slug')
  getPublicBySlug(@Param('slug') slug: string) {
    return this.queries.getPublishedBySlug(slug);
  }

  @RequirePermissions('project:read')
  @Get('admin/projects')
  listAdmin(@Query(paginationPipe) query: PageRequest) {
    return this.queries.listAll(query);
  }

  @RequirePermissions('project:read')
  @Get('admin/projects/:id')
  getAdminById(@Param('id', uuidPipe) id: string) {
    return this.queries.getById(id);
  }

  @RequirePermissions('project:create')
  @Post('admin/projects')
  create(@Body(new ZodValidationPipe(projectCreateSchema)) body: ProjectCreateInput, @CurrentUser() user: SessionUser) {
    return this.createProject.execute(body, user.id);
  }

  @RequirePermissions('project:update')
  @Patch('admin/projects/:id')
  update(
    @Param('id', uuidPipe) id: string,
    @Body(new ZodValidationPipe(projectUpdateSchema)) body: ProjectUpdateInput,
    @CurrentUser() user: SessionUser,
  ) {
    return this.updateProject.execute(id, body, user.id);
  }

  @RequirePermissions('project:publish')
  @Post('admin/projects/:id/publish')
  publish(@Param('id', uuidPipe) id: string, @CurrentUser() user: SessionUser) {
    return this.changeStatus.execute(id, 'publish', user.id);
  }

  @RequirePermissions('project:unpublish')
  @Post('admin/projects/:id/unpublish')
  unpublish(@Param('id', uuidPipe) id: string, @CurrentUser() user: SessionUser) {
    return this.changeStatus.execute(id, 'unpublish', user.id);
  }

  @RequirePermissions('project:archive')
  @Post('admin/projects/:id/archive')
  archive(@Param('id', uuidPipe) id: string, @CurrentUser() user: SessionUser) {
    return this.changeStatus.execute(id, 'archive', user.id);
  }

  @RequirePermissions('project:assign_author')
  @Patch('admin/projects/:id/author')
  assignAuthor(
    @Param('id', uuidPipe) id: string,
    @Body(new ZodValidationPipe(projectAuthorSchema)) body: z.infer<typeof projectAuthorSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.assignProjectAuthor.execute(id, body.userId, user.id);
  }

  @RequirePermissions('project:delete')
  @Delete('admin/projects/:id')
  remove(@Param('id', uuidPipe) id: string, @CurrentUser() user: SessionUser) {
    return this.deleteProject.execute(id, user.id);
  }
}
