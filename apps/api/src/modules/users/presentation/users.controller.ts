import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { userCreateSchema, userUpdateSchema } from '@repo/contracts';
import type { z } from 'zod';
import { ParseCuidPipe } from '../../../common/presentation/parse-cuid.pipe';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import type { SessionUser } from '../../auth/presentation/authenticated-request';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';

@Controller('admin/users')
export class UsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
  ) {}

  @RequirePermissions('user:manage')
  @Get()
  list() {
    return this.listUsers.execute();
  }

  @RequirePermissions('user:manage')
  @Post()
  create(
    @Body(new ZodValidationPipe(userCreateSchema)) body: z.infer<typeof userCreateSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.createUser.execute(body, user.id);
  }

  @RequirePermissions('user:manage')
  @Patch(':id')
  update(
    @Param('id', new ParseCuidPipe()) id: string,
    @Body(new ZodValidationPipe(userUpdateSchema)) body: z.infer<typeof userUpdateSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.updateUser.execute(id, body, user.id);
  }
}
