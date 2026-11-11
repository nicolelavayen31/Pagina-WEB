import { Module } from '@nestjs/common';
import { UserDirectory } from './application/ports/user-directory';
import { UserRepository } from './application/ports/user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { PrismaUserDirectory } from './infrastructure/prisma-user-directory';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: UserDirectory, useClass: PrismaUserDirectory },
    ListUsersUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
  ],
  exports: [UserDirectory],
})
export class UsersModule {}
