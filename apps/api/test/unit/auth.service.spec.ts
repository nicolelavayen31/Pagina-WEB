import { ConfigService } from '@nestjs/config';
import { AuthService, hashSessionToken } from '../../src/modules/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';

const config = { get: jest.fn().mockReturnValue(60 * 60 * 1000) } as unknown as ConfigService;

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    lastSeenAt: new Date(),
    user: {
      id: 'user-1',
      email: 'ops@example.com',
      name: 'Operator',
      isActive: true,
      roles: [{ role: { name: 'ADMIN', permissions: [{ permission: { name: 'project:read' } }] } }],
    },
    ...overrides,
  };
}

describe('AuthService', () => {
  it('stores only the hash of the session token', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'session-1' });
    const prisma = { session: { create } } as unknown as PrismaService;
    const service = new AuthService(prisma, config as never);

    const result = await service.createSession('user-1', 'Mozilla/5.0', '127.0.0.1');

    const stored = create.mock.calls[0][0].data.sessionKey;
    expect(result.token).toHaveLength(43);
    expect(stored).toBe(hashSessionToken(result.token));
    expect(stored).not.toBe(result.token);
  });

  it('resolves a valid session with permissions loaded from the database', async () => {
    const prisma = { session: { findUnique: jest.fn().mockResolvedValue(sessionRow()) } } as unknown as PrismaService;
    const service = new AuthService(prisma, config as never);

    const user = await service.resolveSession('token');

    expect(user).toMatchObject({ id: 'user-1', roles: ['ADMIN'], permissions: ['project:read'], sessionId: 'session-1' });
  });

  it.each([
    ['revoked', { revokedAt: new Date() }],
    ['expired', { expiresAt: new Date(Date.now() - 1000) }],
  ])('rejects a %s session', async (_label, overrides) => {
    const prisma = {
      session: { findUnique: jest.fn().mockResolvedValue(sessionRow(overrides)) },
    } as unknown as PrismaService;
    const service = new AuthService(prisma, config as never);

    await expect(service.resolveSession('token')).resolves.toBeNull();
  });

  it('rejects the session of a deactivated user', async () => {
    const row = sessionRow();
    row.user.isActive = false;
    const prisma = { session: { findUnique: jest.fn().mockResolvedValue(row) } } as unknown as PrismaService;
    const service = new AuthService(prisma, config as never);

    await expect(service.resolveSession('token')).resolves.toBeNull();
  });

  it('rejects missing or oversized tokens without querying the database', async () => {
    const findUnique = jest.fn();
    const service = new AuthService({ session: { findUnique } } as unknown as PrismaService, config as never);

    await expect(service.resolveSession(undefined)).resolves.toBeNull();
    await expect(service.resolveSession('x'.repeat(500))).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
