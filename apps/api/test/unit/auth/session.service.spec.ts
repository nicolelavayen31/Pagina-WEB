import type { NewSession, SessionRepository, StoredSession } from '../../../src/modules/auth/application/ports/session.repository';
import { SessionService } from '../../../src/modules/auth/application/session.service';
import { hashSessionToken } from '../../../src/modules/auth/domain/session-token';

function storedSession(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    id: 'session-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    lastSeenAt: new Date(),
    user: {
      id: 'user-1',
      email: 'ops@example.com',
      name: 'Operator',
      roles: ['ADMIN'],
      permissions: ['project:read'],
      isActive: true,
    },
    ...overrides,
  };
}

function serviceWith(session: StoredSession | null) {
  const repository = {
    create: jest.fn(async (_session: NewSession) => ({ id: 'session-1' })),
    findByTokenHash: jest.fn(async () => session),
    touch: jest.fn(async () => undefined),
    revokeByTokenHash: jest.fn(async () => undefined),
    revokeAllForUser: jest.fn(async () => undefined),
  } satisfies SessionRepository;
  return { repository, service: new SessionService(repository, { ttlMs: 60 * 60 * 1000 }) };
}

describe('SessionService', () => {
  it('stores only the hash of the session token', async () => {
    const { service, repository } = serviceWith(null);

    const result = await service.create('user-1', { userAgent: 'Mozilla/5.0', ipAddress: '127.0.0.1' });

    const stored = repository.create.mock.calls[0][0].tokenHash;
    expect(result.token).toHaveLength(43);
    expect(stored).toBe(hashSessionToken(result.token));
    expect(stored).not.toBe(result.token);
  });

  it('resolves a valid session with the permissions loaded by the repository', async () => {
    const { service } = serviceWith(storedSession());

    const user = await service.resolve('token');

    expect(user).toEqual({
      id: 'user-1',
      email: 'ops@example.com',
      name: 'Operator',
      roles: ['ADMIN'],
      permissions: ['project:read'],
      sessionId: 'session-1',
    });
  });

  it.each([
    ['revoked', storedSession({ revokedAt: new Date() })],
    ['expired', storedSession({ expiresAt: new Date(Date.now() - 1000) })],
    ['deactivated-user', storedSession({ user: { ...storedSession().user, isActive: false } })],
  ])('rejects a %s session', async (_label, session) => {
    const { service } = serviceWith(session);
    await expect(service.resolve('token')).resolves.toBeNull();
  });

  it('rejects missing or oversized tokens without querying the repository', async () => {
    const { service, repository } = serviceWith(storedSession());

    await expect(service.resolve(undefined)).resolves.toBeNull();
    await expect(service.resolve('x'.repeat(500))).resolves.toBeNull();
    expect(repository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('refreshes lastSeenAt only when it is stale', async () => {
    const fresh = serviceWith(storedSession());
    await fresh.service.resolve('token');
    expect(fresh.repository.touch).not.toHaveBeenCalled();

    const stale = serviceWith(storedSession({ lastSeenAt: new Date(Date.now() - 10 * 60 * 1000) }));
    await stale.service.resolve('token');
    expect(stale.repository.touch).toHaveBeenCalledWith('session-1', expect.any(Date));
  });
});
