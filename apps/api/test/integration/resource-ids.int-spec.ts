import {
  ALLOWED_ORIGIN,
  createTestApp,
  createUser,
  resetDatabase,
  sessionCookieFor,
  type TestContext,
} from './helpers';

/** cuid-keyed resources (users, services): malformed ids are 400, well-formed unknown ids 404. */
describe('Resource ids on cuid-keyed routes (PostgreSQL)', () => {
  let ctx: TestContext;
  let cookie: string;
  let pmId: string;

  const UNKNOWN_CUID = 'czzzzzzzzzzzzzzzzzzzzzzzz';

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    pmId = (await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] })).id;
    cookie = await sessionCookieFor(ctx.prisma, admin.id);
  });

  const patch = (path: string, body: object) =>
    ctx.http().patch(path).set('Cookie', cookie).set('Origin', ALLOWED_ORIGIN).send(body);

  it('users: malformed id 400, unknown id 404, real id 200', async () => {
    expect((await patch('/api/v1/admin/users/123', { name: 'Nuevo nombre' })).status).toBe(400);
    expect((await patch(`/api/v1/admin/users/${UNKNOWN_CUID}`, { name: 'Nuevo nombre' })).status).toBe(404);
    expect((await patch(`/api/v1/admin/users/${pmId}`, { name: 'Nuevo nombre' })).status).toBe(200);
  });

  it('services: malformed id 400, unknown id 404, real id 200', async () => {
    const service = await ctx.prisma.service.create({
      data: { name: 'Pintura', slug: 'pintura', summary: 'Pintura interior y exterior.', description: 'Servicio de pintura.' },
    });

    expect((await patch('/api/v1/admin/services/nope', { sortOrder: 1 })).status).toBe(400);
    expect((await patch(`/api/v1/admin/services/${UNKNOWN_CUID}`, { sortOrder: 1 })).status).toBe(404);
    expect((await patch(`/api/v1/admin/services/${service.id}`, { sortOrder: 1 })).status).toBe(200);
  });
});
