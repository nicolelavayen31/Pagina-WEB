import type { AuditEntry } from '../../../src/modules/audit/application/audit-logger';
import type { PasswordHasher } from '../../../src/modules/auth/application/ports/password-hasher';
import type { UserAccount, UserAccountRepository } from '../../../src/modules/auth/application/ports/user-account.repository';
import type { SessionService } from '../../../src/modules/auth/application/session.service';
import { LoginUseCase } from '../../../src/modules/auth/application/use-cases/login.use-case';
import { InvalidCredentialsError } from '../../../src/modules/auth/domain/auth.errors';

const account: UserAccount = {
  id: 'user-1',
  email: 'ops@example.com',
  name: 'Operator',
  roles: ['ADMIN'],
  permissions: ['project:read'],
  passwordHash: 'hash:correct',
  isActive: true,
};

function setup(stored: UserAccount | null) {
  const accounts = {
    findByEmail: jest.fn(async () => stored),
    recordLogin: jest.fn(async () => undefined),
  } satisfies UserAccountRepository;
  const passwords = {
    hash: jest.fn(async (password: string) => `hash:${password}`),
    verify: jest.fn(async (hash: string, password: string) => hash === `hash:${password}`),
  } satisfies PasswordHasher;
  const sessions = {
    create: jest.fn(async () => ({ sessionId: 'session-1', token: 'tok', expiresAt: new Date() })),
  } as unknown as SessionService;
  const auditEntries: AuditEntry[] = [];
  const useCase = new LoginUseCase(accounts, passwords, sessions, { log: async (e) => void auditEntries.push(e) });
  const login = (password: string) =>
    useCase.execute({ email: 'OPS@example.com', password, userAgent: null, ipAddress: null });
  return { login, accounts, passwords, auditEntries };
}

describe('LoginUseCase', () => {
  it('returns the public user, records the login and audits it', async () => {
    const { login, accounts, auditEntries } = setup(account);

    const { user, session } = await login('correct');

    expect(user).toEqual({ id: 'user-1', email: 'ops@example.com', name: 'Operator', roles: ['ADMIN'], permissions: ['project:read'] });
    expect(user).not.toHaveProperty('passwordHash');
    expect(session.sessionId).toBe('session-1');
    expect(accounts.recordLogin).toHaveBeenCalledWith('user-1', expect.any(Date));
    expect(auditEntries).toEqual([{ actorId: 'user-1', action: 'auth.login', entityType: 'Session', entityId: 'session-1' }]);
  });

  it('rejects a wrong password', async () => {
    const { login, accounts } = setup(account);
    await expect(login('wrong')).rejects.toThrow(InvalidCredentialsError);
    expect(accounts.recordLogin).not.toHaveBeenCalled();
  });

  it.each([
    ['unknown', null],
    ['inactive', { ...account, isActive: false }],
  ])('rejects an %s account after spending a password verification', async (_label, stored) => {
    const { login, passwords } = setup(stored);
    await expect(login('correct')).rejects.toThrow(InvalidCredentialsError);
    expect(passwords.verify).toHaveBeenCalledTimes(1);
  });
});
