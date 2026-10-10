import { randomUUID } from 'crypto';
import {
  ALLOWED_ORIGIN,
  createTestApp,
  createUser,
  leadPayload,
  resetDatabase,
  sessionCookieFor,
  type TestContext,
} from './helpers';

describe('Quote requests / leads (PostgreSQL)', () => {
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

  const post = (body: object) => ctx.http().post('/api/v1/leads').set('Origin', ALLOWED_ORIGIN).send(body);

  it('persists a valid request with server-controlled consent fields', async () => {
    const before = Date.now();
    const res = await post(leadPayload());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true });

    const lead = await ctx.prisma.lead.findFirstOrThrow();
    expect(lead).toMatchObject({
      name: 'Ana Pérez',
      email: 'ana.perez@example.com',
      budgetRange: 'FROM_1K_TO_5K',
      status: 'NEW',
      privacyNoticeVersion: 'v1',
    });
    expect(lead.consentAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it('links the lead to an active service', async () => {
    const service = await ctx.prisma.service.create({
      data: { name: 'Pintura', slug: 'pintura', summary: 'Pintura general', description: 'Servicio de pintura interior.' },
    });
    expect((await post(leadPayload({ serviceId: service.id }))).status).toBe(201);
    expect((await ctx.prisma.lead.findFirstOrThrow()).serviceId).toBe(service.id);
  });

  it('rejects unknown or inactive services with 400', async () => {
    const inactive = await ctx.prisma.service.create({
      data: { name: 'Viejo', slug: 'viejo', summary: 'Servicio retirado', description: 'Ya no se ofrece.', isActive: false },
    });
    expect((await post(leadPayload({ serviceId: 'does-not-exist' }))).status).toBe(400);
    expect((await post(leadPayload({ serviceId: inactive.id }))).status).toBe(400);
    expect(await ctx.prisma.lead.count()).toBe(0);
  });

  it('returns 400 (never 500) for the legacy payload with "budget" and "consentAt"', async () => {
    const legacy = { ...leadPayload(), budget: '5000', consentAt: new Date().toISOString(), privacyNoticeVersion: 'v1' };
    const res = await post(legacy);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Datos inválidos');
    expect(await ctx.prisma.lead.count()).toBe(0);
  });

  it('returns field errors for invalid input', async () => {
    const res = await post(leadPayload({ email: 'no-es-correo', description: 'corta' }));
    expect(res.status).toBe(400);
    const paths = res.body.errors.map((error: { path: string }) => error.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'description']));
  });

  it('requires explicit privacy consent', async () => {
    const { privacyAccepted: _omit, ...withoutConsent } = leadPayload();
    expect((await post(withoutConsent)).status).toBe(400);
  });

  it('honeypot: answers like a success but stores nothing', async () => {
    const res = await post(leadPayload({ website: 'http://spam.example' }));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true });
    expect(await ctx.prisma.lead.count()).toBe(0);
  });

  it('leads are never publicly readable', async () => {
    await post(leadPayload());
    expect((await ctx.http().get('/api/v1/admin/leads')).status).toBe(401);
    expect((await ctx.http().get('/api/v1/leads')).status).toBe(404);
  });

  it('admin can list and change status; invalid input is rejected', async () => {
    const admin = await createUser(ctx.prisma, { email: 'admin@test.local', roles: ['ADMIN'] });
    const cookie = await sessionCookieFor(ctx.prisma, admin.id);
    await post(leadPayload());
    const lead = await ctx.prisma.lead.findFirstOrThrow();

    const list = await ctx.http().get('/api/v1/admin/leads?status=NEW').set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);

    const patch = (id: string, body: object) =>
      ctx.http().patch(`/api/v1/admin/leads/${id}/status`).set('Cookie', cookie).set('Origin', ALLOWED_ORIGIN).send(body);

    expect((await patch(lead.id, { status: 'BOGUS' })).status).toBe(400);
    expect((await patch('not-a-uuid', { status: 'CONTACTED' })).status).toBe(400);
    expect((await patch(randomUUID(), { status: 'CONTACTED' })).status).toBe(404);

    const ok = await patch(lead.id, { status: 'CONTACTED' });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('CONTACTED');

    const audit = await ctx.prisma.auditLog.findFirstOrThrow({ where: { action: 'lead.status_changed' } });
    expect(audit).toMatchObject({ actorUserId: admin.id, entityId: lead.id });
  });
});
