import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from '@repo/contracts';
import { ParseCuidPipe } from '../../../common/presentation/parse-cuid.pipe';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import type { SessionUser } from '../../auth/presentation/authenticated-request';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import { ServiceQueries } from '../application/service.queries';
import { CreateServiceUseCase } from '../application/use-cases/create-service.use-case';
import { UpdateServiceUseCase } from '../application/use-cases/update-service.use-case';

@Controller()
export class ServicesController {
  constructor(
    private readonly queries: ServiceQueries,
    private readonly createService: CreateServiceUseCase,
    private readonly updateService: UpdateServiceUseCase,
  ) {}

  @Get('services')
  list() {
    return this.queries.listActive();
  }

  @Get('services/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.queries.getActiveBySlug(slug);
  }

  @RequirePermissions('service:read')
  @Get('admin/services')
  listAdmin() {
    return this.queries.listAll();
  }

  @RequirePermissions('service:write')
  @Post('admin/services')
  create(@Body(new ZodValidationPipe(serviceCreateSchema)) body: ServiceCreateInput, @CurrentUser() user: SessionUser) {
    return this.createService.execute(body, user.id);
  }

  @RequirePermissions('service:write')
  @Patch('admin/services/:id')
  update(
    @Param('id', new ParseCuidPipe()) id: string,
    @Body(new ZodValidationPipe(serviceUpdateSchema)) body: ServiceUpdateInput,
    @CurrentUser() user: SessionUser,
  ) {
    return this.updateService.execute(id, body, user.id);
  }
}
