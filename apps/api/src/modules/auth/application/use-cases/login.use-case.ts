import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { InvalidCredentialsError } from '../../domain/auth.errors';
import type { AuthenticatedUser } from '../authenticated-user';
import { PasswordHasher } from '../ports/password-hasher';
import { UserAccountRepository } from '../ports/user-account.repository';
import { SessionService, type IssuedSession } from '../session.service';

export type LoginCommand = {
  email: string;
  password: string;
  userAgent: string | null;
  ipAddress: string | null;
};

@Injectable()
export class LoginUseCase {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly accounts: UserAccountRepository,
    private readonly passwords: PasswordHasher,
    private readonly sessions: SessionService,
    private readonly audit: AuditLogger,
  ) {}

  async execute(command: LoginCommand): Promise<{ user: AuthenticatedUser; session: IssuedSession }> {
    const user = await this.authenticate(command.email, command.password);
    const session = await this.sessions.create(user.id, command);
    await this.audit.log({ actorId: user.id, action: 'auth.login', entityType: 'Session', entityId: session.sessionId });
    return { user, session };
  }

  private async authenticate(email: string, password: string): Promise<AuthenticatedUser> {
    const account = await this.accounts.findByEmail(email);

    if (!account || !account.isActive) {
      // Spend comparable time so response timing does not reveal which accounts exist.
      await this.verifyAgainstDummy(password);
      throw new InvalidCredentialsError();
    }

    if (!(await this.passwords.verify(account.passwordHash, password))) {
      throw new InvalidCredentialsError();
    }

    await this.accounts.recordLogin(account.id, new Date());
    const { passwordHash: _passwordHash, isActive: _isActive, ...user } = account;
    return user;
  }

  private async verifyAgainstDummy(password: string): Promise<void> {
    this.dummyHash ??= this.passwords.hash(randomBytes(16).toString('hex'));
    await this.passwords.verify(await this.dummyHash, password);
  }
}
