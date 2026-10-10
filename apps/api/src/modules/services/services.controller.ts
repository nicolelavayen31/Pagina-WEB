import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from '@repo/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { SessionUser } from '../../common/http/authenticated-request';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ServicesService } from './services.service';

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('services')
  list() {
    return this.servicesService.listPublic();
  }

  @Get('services/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.servicesService.findPublicBySlug(slug);
  }

  @RequirePermissions('service:read')
  @Get('admin/services')
  listAdmin() {
    return this.servicesService.listAdmin();
  }

  @RequirePermissions('service:write')
  @Post('admin/services')
  create(
    @Body(new ZodValidationPipe(serviceCreateSchema)) body: ServiceCreateInput,
    @CurrentUser() user: SessionUser,
  ) {
    return this.servicesService.create(body, user.id);
  }

  @RequirePermissions('service:write')
  @Patch('admin/services/:id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(serviceUpdateSchema)) body: ServiceUpdateInput,
    @CurrentUser() user: SessionUser,
  ) {
    return this.servicesService.update(id, body, user.id);
  }
}
