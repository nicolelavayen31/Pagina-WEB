import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthService', () => {
  it('creates a session for an authenticated user', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'ops@example.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$test',
        name: 'Operator',
        isActive: true,
        roles: [],
      }) },
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
    } as unknown as PrismaService;

    const jwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt'),
    } as any;

    const service = new AuthService(prisma, jwtService);
    const result = await service.createSession('user-1', 'Mozilla/5.0', '127.0.0.1');

    expect(result).toMatchObject({ sessionKey: expect.any(String) });
    expect(prisma.session.create).toHaveBeenCalled();
  });
});
