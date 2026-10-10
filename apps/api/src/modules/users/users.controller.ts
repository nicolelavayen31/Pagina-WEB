import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { userCreateSchema, userUpdateSchema } from '@repo/contracts';
import type { z } from 'zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { SessionUser } from '../../common/http/authenticated-request';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequirePermissions('user:manage')
  @Get()
  list() {
    return this.users.list();
  }

  @RequirePermissions('user:manage')
  @Post()
  create(
    @Body(new ZodValidationPipe(userCreateSchema)) body: z.infer<typeof userCreateSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.users.create(body, user.id);
  }

  @RequirePermissions('user:manage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(userUpdateSchema)) body: z.infer<typeof userUpdateSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.users.update(id, body, user.id);
  }
}
