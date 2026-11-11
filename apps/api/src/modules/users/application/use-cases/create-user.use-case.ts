import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { PasswordHasher } from '../../../auth/application/ports/password-hasher';
import { UserRepository, type UserView } from '../ports/user.repository';
import { resolveRoleIds } from './resolve-role-ids';

export type CreateUserCommand = { email: string; name: string; password: string; roles: string[] };

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly audit: AuditLogger,
  ) {}

  async execute(command: CreateUserCommand, actorId: string): Promise<UserView> {
    const roleIds = await resolveRoleIds(this.users, command.roles);
    const user = await this.users.create({
      email: command.email.toLowerCase(),
      name: command.name,
      passwordHash: await this.passwords.hash(command.password),
      roleIds,
    });
    await this.audit.log({
      actorId,
      action: 'user.created',
      entityType: 'User',
      entityId: user.id,
      metadata: { roles: command.roles },
    });
    return user;
  }
}
