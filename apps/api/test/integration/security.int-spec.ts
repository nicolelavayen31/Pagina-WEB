import {
  ALLOWED_ORIGIN,
  createTestApp,
  createUser,
  leadPayload,
  resetDatabase,
  sessionCookieFor,
  TEST_PASSWORD,
  type TestContext,
} from './helpers';

describe('HTTP hardening, health, users, services and dashboard (PostgreSQL)', () => {
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

  it('sends security headers and hides the framework', async () => {
    const res = await ctx.http().get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('readiness checks the database', async () => {
    const res = await ctx.http().get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready', database: 'up' });
  });

  it('blocks state-changing requests from foreign origins (CSRF)', async () => {
    const evil = await ctx.http().post('/api/v1/leads').set('Origin', 'https://evil.example').send(leadPayload());
    expect(evil.status).toBe(403);
    const ok = await ctx.http().post('/api/v1/leads').set('Origin', ALLOWED_ORIGIN).send(leadPayload());
    expect(ok.status).toBe(201);
  });

  it('malformed JSON returns a JSON 400 without stack traces', async () => {
    const res = await ctx.http()
      .post('/api/v1/leads')
      .set('Content-Type', 'application/json')
      .send('{"name": "Ana", ');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });

  it('unknown routes return JSON 404', async () => {
    const res = await ctx.http().get('/api/v1/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.statusCode).toBe(404);
  });

  describe('user management', () => {
    it('admin creates a project manager who can then log in', async () => {
      const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
      const cookie = await sessionCookieFor(ctx.prisma, admin.id);

      const created = await ctx.http()
        .post('/api/v1/admin/users')
        .set('Cookie', cookie)
        .send({ email: 'Nuevo.PM@test.local', name: 'Nuevo PM', password: TEST_PASSWORD, roles: ['PROJECT_MANAGER'] });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ email: 'nuevo.pm@test.local', roles: ['PROJECT_MANAGER'] });
      expect(created.body).not.toHaveProperty('passwordHash');

      const login = await ctx.http().post('/api/v1/auth/login').send({ email: 'nuevo.pm@test.local', password: TEST_PASSWORD });
      expect(login.status).toBe(200);
    });

    it('rejects weak passwords and duplicate emails', async () => {
      const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
      const cookie = await sessionCookieFor(ctx.prisma, admin.id);
      const body = { email: 'x@test.local', name: 'Equis', roles: ['PROJECT_MANAGER'] };

      expect((await ctx.http().post('/api/v1/admin/users').set('Cookie', cookie).send({ ...body, password: 'corta' })).status).toBe(400);
      expect((await ctx.http().post('/api/v1/admin/users').set('Cookie', cookie).send({ ...body, email: 'admin@test.local', password: TEST_PASSWORD })).status).toBe(409);
    });

    it('admin cannot lock themselves out', async () => {
      const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
      const cookie = await sessionCookieFor(ctx.prisma, admin.id);
      const self = (body: object) => ctx.http().patch(`/api/v1/admin/users/${admin.id}`).set('Cookie', cookie).send(body);

      expect((await self({ isActive: false })).status).toBe(400);
      expect((await self({ roles: ['PROJECT_MANAGER'] })).status).toBe(400);
    });

    it('deactivating a user revokes all their sessions', async () => {
      const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
      const pm = await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] });
      const adminCookie = await sessionCookieFor(ctx.prisma, admin.id);
      const pmCookie = await sessionCookieFor(ctx.prisma, pm.id);

      const res = await ctx.http().patch(`/api/v1/admin/users/${pm.id}`).set('Cookie', adminCookie).send({ isActive: false });
      expect(res.status).toBe(200);
      expect((await ctx.http().get('/api/v1/auth/me').set('Cookie', pmCookie)).status).toBe(401);
      expect(await ctx.prisma.session.count({ where: { userId: pm.id, revokedAt: null } })).toBe(0);
    });
  });

  describe('services catalogue', () => {
    it('public list shows only active services and hides admin fields', async () => {
      await ctx.prisma.service.createMany({
        data: [
          { name: 'Activo', slug: 'activo', summary: 'Servicio activo', description: 'Descripción del servicio activo.', sortOrder: 2 },
          { name: 'Inactivo', slug: 'inactivo', summary: 'Servicio retirado', description: 'Ya no se ofrece.', isActive: false },
        ],
      });
      const res = await ctx.http().get('/api/v1/services');
      expect(res.body.map((service: { slug: string }) => service.slug)).toEqual(['activo']);
      expect(res.body[0]).not.toHaveProperty('isActive');
      expect((await ctx.http().get('/api/v1/services/inactivo')).status).toBe(404);
    });

    it('only service:write can create services; duplicates are 409', async () => {
      const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
      const pm = await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] });
      const body = { name: 'Impermeabilización', slug: 'impermeabilizacion', summary: 'Cubiertas y terrazas', description: 'Impermeabilización de cubiertas y terrazas.' };

      expect((await ctx.http().post('/api/v1/admin/services').set('Cookie', await sessionCookieFor(ctx.prisma, pm.id)).send(body)).status).toBe(403);
      const adminCookie = await sessionCookieFor(ctx.prisma, admin.id);
      expect((await ctx.http().post('/api/v1/admin/services').set('Cookie', adminCookie).send(body)).status).toBe(201);
      expect((await ctx.http().post('/api/v1/admin/services').set('Cookie', adminCookie).send(body)).status).toBe(409);
    });
  });

  it('dashboard only includes the blocks the user may read', async () => {
    const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const pm = await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] });
    await ctx.http().post('/api/v1/leads').send(leadPayload());

    const adminView = await ctx.http().get('/api/v1/admin/dashboard').set('Cookie', await sessionCookieFor(ctx.prisma, admin.id));
    expect(adminView.body.leads).toEqual({ total: 1, new: 1 });

    const pmView = await ctx.http().get('/api/v1/admin/dashboard').set('Cookie', await sessionCookieFor(ctx.prisma, pm.id));
    expect(pmView.body.leads).toBeNull();
    expect(pmView.body.services).toBeNull();
    expect(pmView.body.projects.total).toBe(0);
  });
});
