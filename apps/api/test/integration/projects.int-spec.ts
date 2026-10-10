import { randomUUID } from 'crypto';
import {
  ALLOWED_ORIGIN,
  createTestApp,
  createUser,
  projectPayload,
  resetDatabase,
  sessionCookieFor,
  type TestContext,
} from './helpers';

describe('Projects CRUD and publication (PostgreSQL)', () => {
  let ctx: TestContext;
  let adminCookie: string;
  let pmCookie: string;
  let pmId: string;
  let adminId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const pm = await createUser(ctx.prisma, { email: 'pm@test.local', roles: ['PROJECT_MANAGER'] });
    adminId = admin.id;
    pmId = pm.id;
    adminCookie = await sessionCookieFor(ctx.prisma, admin.id);
    pmCookie = await sessionCookieFor(ctx.prisma, pm.id);
  });

  const as = (cookie: string) => ({
    get: (path: string) => ctx.http().get(path).set('Cookie', cookie),
    post: (path: string, body?: object) => ctx.http().post(path).set('Cookie', cookie).set('Origin', ALLOWED_ORIGIN).send(body),
    patch: (path: string, body: object) => ctx.http().patch(path).set('Cookie', cookie).set('Origin', ALLOWED_ORIGIN).send(body),
    delete: (path: string) => ctx.http().delete(path).set('Cookie', cookie).set('Origin', ALLOWED_ORIGIN),
  });

  it('full lifecycle: create draft -> hidden -> publish -> public -> unpublish -> hidden', async () => {
    const created = await as(pmCookie).post('/api/v1/admin/projects', projectPayload({ slug: 'oficinas-quito' }));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'DRAFT', createdById: pmId, publishedAt: null });
    const id = created.body.id;

    expect((await ctx.http().get('/api/v1/projects')).body.total).toBe(0);
    expect((await ctx.http().get('/api/v1/projects/oficinas-quito')).status).toBe(404);

    const published = await as(adminCookie).post(`/api/v1/admin/projects/${id}/publish`);
    expect(published.status).toBe(201);
    expect(published.body.publishedAt).not.toBeNull();

    const list = await ctx.http().get('/api/v1/projects');
    expect(list.body.total).toBe(1);
    const detail = await ctx.http().get('/api/v1/projects/oficinas-quito');
    expect(detail.status).toBe(200);

    expect((await as(adminCookie).post(`/api/v1/admin/projects/${id}/unpublish`)).status).toBe(201);
    expect((await ctx.http().get('/api/v1/projects/oficinas-quito')).status).toBe(404);
  });

  it('public responses never expose authorship, status or storage details', async () => {
    const created = await as(adminCookie).post('/api/v1/admin/projects', projectPayload({ slug: 'publico' }));
    await as(adminCookie).post(`/api/v1/admin/projects/${created.body.id}/publish`);

    const detail = await ctx.http().get('/api/v1/projects/publico');
    for (const key of ['createdById', 'updatedById', 'status', 'creator', 'updater']) {
      expect(detail.body).not.toHaveProperty(key);
    }
    expect(JSON.stringify(detail.body)).not.toContain('storageKey');
  });

  it('clients cannot set status or authorship (publication bypass closed)', async () => {
    const withStatus = await as(pmCookie).post('/api/v1/admin/projects', projectPayload({ status: 'PUBLISHED' }));
    expect(withStatus.status).toBe(400);

    const created = await as(pmCookie).post('/api/v1/admin/projects', projectPayload());
    const id = created.body.id;
    expect((await as(pmCookie).patch(`/api/v1/admin/projects/${id}`, { status: 'PUBLISHED' })).status).toBe(400);
    expect((await as(pmCookie).patch(`/api/v1/admin/projects/${id}`, { createdById: adminId })).status).toBe(400);
    expect((await as(pmCookie).post(`/api/v1/admin/projects/${id}/publish`)).status).toBe(403);

    const stored = await ctx.prisma.project.findUniqueOrThrow({ where: { id } });
    expect(stored).toMatchObject({ status: 'DRAFT', createdById: pmId });
  });

  it('only ADMIN can reassign the author, and only to an active user', async () => {
    const created = await as(pmCookie).post('/api/v1/admin/projects', projectPayload());
    const id = created.body.id;
    const inactive = await createUser(ctx.prisma, { email: 'inactive@test.local', roles: ['PROJECT_MANAGER'], isActive: false });

    expect((await as(pmCookie).patch(`/api/v1/admin/projects/${id}/author`, { userId: adminId })).status).toBe(403);
    expect((await as(adminCookie).patch(`/api/v1/admin/projects/${id}/author`, { userId: inactive.id })).status).toBe(400);
    const ok = await as(adminCookie).patch(`/api/v1/admin/projects/${id}/author`, { userId: adminId });
    expect(ok.status).toBe(200);
    expect(ok.body.createdById).toBe(adminId);
  });

  it('duplicate slugs return 409, unknown ids 404, malformed ids 400', async () => {
    await as(adminCookie).post('/api/v1/admin/projects', projectPayload({ slug: 'repetido' }));
    expect((await as(adminCookie).post('/api/v1/admin/projects', projectPayload({ slug: 'repetido' }))).status).toBe(409);
    expect((await as(adminCookie).get(`/api/v1/admin/projects/${randomUUID()}`)).status).toBe(404);
    expect((await as(adminCookie).get('/api/v1/admin/projects/123')).status).toBe(400);
  });

  it('archive hides from the public site; delete is ADMIN only and audited', async () => {
    const created = await as(adminCookie).post('/api/v1/admin/projects', projectPayload({ slug: 'para-archivar' }));
    const id = created.body.id;
    await as(adminCookie).post(`/api/v1/admin/projects/${id}/publish`);

    expect((await as(pmCookie).post(`/api/v1/admin/projects/${id}/archive`)).status).toBe(201);
    expect((await ctx.http().get('/api/v1/projects/para-archivar')).status).toBe(404);

    expect((await as(pmCookie).delete(`/api/v1/admin/projects/${id}`)).status).toBe(403);
    expect((await as(adminCookie).delete(`/api/v1/admin/projects/${id}`)).status).toBe(200);
    expect((await as(adminCookie).get(`/api/v1/admin/projects/${id}`)).status).toBe(404);

    const actions = (await ctx.prisma.auditLog.findMany({ where: { entityId: id } })).map((entry) => entry.action);
    expect(actions).toEqual(
      expect.arrayContaining(['project.created', 'project.published', 'project.archived', 'project.deleted']),
    );
  });

  it('stores HTML in descriptions as plain data (rendering is responsible for escaping)', async () => {
    const xss = '<script>alert(1)</script><img src=x onerror=alert(1)> ' + 'texto '.repeat(20);
    const created = await as(adminCookie).post('/api/v1/admin/projects', projectPayload({ slug: 'xss', description: xss }));
    await as(adminCookie).post(`/api/v1/admin/projects/${created.body.id}/publish`);

    const res = await ctx.http().get('/api/v1/projects/xss');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.description).toBe(xss.trim());
  });

  it('public list is paginated', async () => {
    for (let i = 0; i < 3; i++) {
      const created = await as(adminCookie).post('/api/v1/admin/projects', projectPayload({ slug: `pag-${i}` }));
      await as(adminCookie).post(`/api/v1/admin/projects/${created.body.id}/publish`);
    }
    const page = await ctx.http().get('/api/v1/projects?page=2&pageSize=2');
    expect(page.body).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(page.body.items).toHaveLength(1);
    expect((await ctx.http().get('/api/v1/projects?pageSize=500')).status).toBe(400);
  });
});
