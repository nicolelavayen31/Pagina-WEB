import { createTestApp, leadPayload, resetDatabase, type TestContext } from './helpers';

describe('Rate limiting (fresh app, real limits)', () => {
  let ctx: TestContext;
  const previous = { login: process.env.RATE_LIMIT_LOGIN, leads: process.env.RATE_LIMIT_LEADS };

  beforeAll(async () => {
    process.env.RATE_LIMIT_LOGIN = '5';
    process.env.RATE_LIMIT_LEADS = '3';
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    process.env.RATE_LIMIT_LOGIN = previous.login;
    process.env.RATE_LIMIT_LEADS = previous.leads;
    await ctx.app.close();
  });

  it('allows 5 login attempts per minute and answers 429 to the 6th', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await ctx.http().post('/api/v1/auth/login').send({ email: 'x@test.local', password: 'incorrecta-123' });
      statuses.push(res.status);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });

  it('allows 3 quote requests per minute and answers 429 to the 4th', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await ctx.http().post('/api/v1/leads').send(leadPayload())).status);
    }
    expect(statuses).toEqual([201, 201, 201, 429]);
    expect(await ctx.prisma.lead.count()).toBe(3);
  });
});
