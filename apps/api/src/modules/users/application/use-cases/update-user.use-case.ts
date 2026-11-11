import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { SessionService } from '../../../auth/application/session.service';
import { assertNoSelfLockout } from '../../domain/self-lockout';
import { UserNotFoundError } from '../../domain/user.errors';
import { UserRepository, type UserView } from '../ports/user.repository';
import { resolveRoleIds } from './resolve-role-ids';

export type UpdateUserCommand = { name?: string; isActive?: boolean; roles?: string[] };

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionService,
    private readonly audit: AuditLogger,
  ) {}

  async execute(id: string, command: UpdateUserCommand, actorId: string): Promise<UserView> {
    if (!(await this.users.exists(id))) {
      throw new UserNotFoundError();
    }
    assertNoSelfLockout(actorId, id, command);

    const roleIds = command.roles ? await resolveRoleIds(this.users, command.roles) : undefined;
    const user = await this.users.update(id, { name: command.name, isActive: command.isActive, roleIds });

    if (command.isActive === false) {
      await this.sessions.revokeAllForUser(id);
    }
    await this.audit.log({
      actorId,
      action: 'user.updated',
      entityType: 'User',
      entityId: id,
      metadata: { fields: Object.keys(command) },
    });
    return user;
  }
}
