import { createTestApp, createUser, projectPayload, resetDatabase, sessionCookieFor, type TestContext } from './helpers';

type Method = 'get' | 'post' | 'patch' | 'delete';
type Row = { label: string; method: Method; path: (projectId: string) => string; body?: object; admin: number; pm: number };

/**
 * Role x endpoint matrix. Expected codes reflect the approved least-privilege matrix:
 * PROJECT_MANAGER may read, create, edit and archive projects but not publish, unpublish,
 * delete, assign authors, or touch leads, services, users or audit logs.
 */
const MATRIX: Row[] = [
  { label: 'list projects', method: 'get', path: () => '/api/v1/admin/projects', admin: 200, pm: 200 },
  { label: 'read project', method: 'get', path: (id) => `/api/v1/admin/projects/${id}`, admin: 200, pm: 200 },
  { label: 'create project', method: 'post', path: () => '/api/v1/admin/projects', body: projectPayload(), admin: 201, pm: 201 },
  { label: 'update project', method: 'patch', path: (id) => `/api/v1/admin/projects/${id}`, body: { title: 'Nuevo título' }, admin: 200, pm: 200 },
  { label: 'publish', method: 'post', path: (id) => `/api/v1/admin/projects/${id}/publish`, admin: 201, pm: 403 },
  { label: 'unpublish', method: 'post', path: (id) => `/api/v1/admin/projects/${id}/unpublish`, admin: 409, pm: 403 },
  { label: 'archive', method: 'post', path: (id) => `/api/v1/admin/projects/${id}/archive`, admin: 201, pm: 201 },
  { label: 'assign author', method: 'patch', path: (id) => `/api/v1/admin/projects/${id}/author`, body: { userId: 'missing' }, admin: 400, pm: 403 },
  { label: 'delete project', method: 'delete', path: (id) => `/api/v1/admin/projects/${id}`, admin: 200, pm: 403 },
  { label: 'list leads', method: 'get', path: () => '/api/v1/admin/leads', admin: 200, pm: 403 },
  { label: 'list services (admin)', method: 'get', path: () => '/api/v1/admin/services', admin: 200, pm: 403 },
  { label: 'list users', method: 'get', path: () => '/api/v1/admin/users', admin: 200, pm: 403 },
  { label: 'read audit log', method: 'get', path: () => '/api/v1/admin/audit', admin: 200, pm: 403 },
  { label: 'dashboard', method: 'get', path: () => '/api/v1/admin/dashboard', admin: 200, pm: 200 },
];

describe('Permission matrix (PostgreSQL)', () => {
  let ctx: TestContext;
  let adminCookie: string;
  let pmCookie: string;
  let noRoleCookie: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
    const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const pm = await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] });
    const nobody = await createUser(ctx.prisma, { email: 'nobody@test.local', roles: [] });
    adminCookie = await sessionCookieFor(ctx.prisma, admin.id);
    pmCookie = await sessionCookieFor(ctx.prisma, pm.id);
    noRoleCookie = await sessionCookieFor(ctx.prisma, nobody.id);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function freshProjectId() {
    const res = await ctx.http().post('/api/v1/admin/projects').set('Cookie', adminCookie).send(projectPayload());
    return res.body.id as string;
  }

  function call(row: Row, id: string, cookie?: string) {
    const req = ctx.http()[row.method](row.path(id));
    if (cookie) req.set('Cookie', cookie);
    return row.body ? req.send(row.method === 'post' && row.label === 'create project' ? projectPayload() : row.body) : req;
  }

  it.each(MATRIX)('ADMIN -> $label = $admin', async (row) => {
    const res = await call(row, await freshProjectId(), adminCookie);
    expect(res.status).toBe(row.admin);
  });

  it.each(MATRIX)('PROJECT_MANAGER -> $label = $pm', async (row) => {
    const res = await call(row, await freshProjectId(), pmCookie);
    expect(res.status).toBe(row.pm);
  });

  it.each(MATRIX)('anonymous -> $label = 401', async (row) => {
    const res = await call(row, await freshProjectId());
    expect(res.status).toBe(401);
  });

  it.each(MATRIX)('user without roles -> $label = 403', async (row) => {
    const res = await call(row, await freshProjectId(), noRoleCookie);
    expect(res.status).toBe(403);
  });

  it('the project manager has exactly the approved permissions in the database', async () => {
    const role = await ctx.prisma.role.findUniqueOrThrow({
      where: { name: 'PROJECT_MANAGER' },
      include: { permissions: { include: { permission: true } } },
    });
    expect(role.permissions.map((rp) => rp.permission.name).sort()).toEqual(
      ['media:delete', 'media:upload', 'project:archive', 'project:create', 'project:read', 'project:update'].sort(),
    );
  });
});
