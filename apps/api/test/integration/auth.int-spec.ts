import { createTestApp, createUser, resetDatabase, sessionCookieFor, TEST_PASSWORD, type TestContext } from './helpers';

describe('Auth and sessions (PostgreSQL)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  it('logs in with valid credentials and sets a hardened cookie', async () => {
    await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });

    const res = await ctx.http().post('/api/v1/auth/login').send({ email: 'ADMIN@test.local', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.roles).toEqual(['ADMIN']);
    expect(res.body.user.permissions).toContain('project:delete');
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/session_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const token = cookie.match(/session_token=([^;]+)/)![1];
    const stored = await ctx.prisma.session.findFirstOrThrow();
    expect(stored.sessionKey).not.toBe(token);
  });

  it('rejects wrong passwords and unknown emails with the same generic 401', async () => {
    await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });

    const wrong = await ctx.http().post('/api/v1/auth/login').send({ email: 'admin@test.local', password: 'incorrecta-123' });
    const unknown = await ctx.http().post('/api/v1/auth/login').send({ email: 'nadie@test.local', password: 'incorrecta-123' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
    expect(await ctx.prisma.session.count()).toBe(0);
  });

  it('rejects inactive users', async () => {
    await createUser(ctx.prisma, { email: 'off@test.local', roles: ['ADMIN'], isActive: false });
    const res = await ctx.http().post('/api/v1/auth/login').send({ email: 'off@test.local', password: TEST_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('returns 400 (not 500) for malformed login payloads', async () => {
    const missing = await ctx.http().post('/api/v1/auth/login').send({ password: 'x'.repeat(10) });
    const extra = await ctx.http().post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(10), role: 'ADMIN' });
    expect(missing.status).toBe(400);
    expect(extra.status).toBe(400);
  });

  it('protects /auth/me and works end to end with the login cookie', async () => {
    await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });

    expect((await ctx.http().get('/api/v1/auth/me')).status).toBe(401);

    const login = await ctx.http().post('/api/v1/auth/login').send({ email: 'admin@test.local', password: TEST_PASSWORD });
    const cookie = String(login.headers['set-cookie']).split(';')[0];

    const me = await ctx.http().get('/api/v1/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('admin@test.local');
    expect(me.body).not.toHaveProperty('sessionId');
  });

  it('logout revokes the session server side', async () => {
    const user = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const cookie = await sessionCookieFor(ctx.prisma, user.id);

    expect((await ctx.http().get('/api/v1/auth/me').set('Cookie', cookie)).status).toBe(200);
    expect((await ctx.http().post('/api/v1/auth/logout').set('Cookie', cookie)).status).toBe(200);

    expect((await ctx.http().get('/api/v1/auth/me').set('Cookie', cookie)).status).toBe(401);
    expect((await ctx.prisma.session.findFirstOrThrow()).revokedAt).not.toBeNull();
  });

  it('rejects expired sessions', async () => {
    const user = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const cookie = await sessionCookieFor(ctx.prisma, user.id, { expiresAt: new Date(Date.now() - 1000) });
    expect((await ctx.http().get('/api/v1/auth/me').set('Cookie', cookie)).status).toBe(401);
  });

  it('deactivating a user cuts off an open session immediately', async () => {
    const user = await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] });
    const cookie = await sessionCookieFor(ctx.prisma, user.id);
    expect((await ctx.http().get('/api/v1/auth/me').set('Cookie', cookie)).status).toBe(200);

    await ctx.prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    expect((await ctx.http().get('/api/v1/auth/me').set('Cookie', cookie)).status).toBe(401);
  });

  it('role changes apply on the next request (permissions are not cached in the cookie)', async () => {
    const user = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const cookie = await sessionCookieFor(ctx.prisma, user.id);
    expect((await ctx.http().get('/api/v1/admin/leads').set('Cookie', cookie)).status).toBe(200);

    await ctx.prisma.userRole.deleteMany({ where: { userId: user.id } });

    expect((await ctx.http().get('/api/v1/admin/leads').set('Cookie', cookie)).status).toBe(403);
  });

  it('ignores forged or garbage cookies', async () => {
    const res = await ctx.http().get('/api/v1/auth/me').set('Cookie', 'session_token=forged-value');
    expect(res.status).toBe(401);
  });
});
