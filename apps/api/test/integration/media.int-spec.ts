import { existsSync } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import {
  ALLOWED_ORIGIN,
  createTestApp,
  createUser,
  projectPayload,
  resetDatabase,
  sessionCookieFor,
  type TestContext,
} from './helpers';

async function jpegWithExif() {
  return sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 200, g: 40, b: 40 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'secreto-interno', Artist: 'Camara del cliente' } })
    .toBuffer();
}

describe('Secure image upload (PostgreSQL + local storage)', () => {
  let ctx: TestContext;
  let adminCookie: string;
  let pmCookie: string;
  let noRoleCookie: string;
  let projectId: string;

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
    const nobody = await createUser(ctx.prisma, { email: 'nobody@test.local' });
    adminCookie = await sessionCookieFor(ctx.prisma, admin.id);
    pmCookie = await sessionCookieFor(ctx.prisma, pm.id);
    noRoleCookie = await sessionCookieFor(ctx.prisma, nobody.id);
    const created = await ctx.http()
      .post('/api/v1/admin/projects')
      .set('Cookie', adminCookie)
      .send(projectPayload({ slug: 'con-imagenes' }));
    projectId = created.body.id;
  });

  const upload = (cookie: string | null, file: Buffer, filename: string, fields: Record<string, string> = {}) => {
    const req = ctx.http().post(`/api/v1/admin/projects/${projectId}/images`).set('Origin', ALLOWED_ORIGIN);
    if (cookie) req.set('Cookie', cookie);
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    return req.attach('file', file, { filename, contentType: 'image/jpeg' });
  };

  it('accepts a JPEG, re-encodes it to WebP, strips EXIF and sets it as cover', async () => {
    const res = await upload(pmCookie, await jpegWithExif(), '../../evil name.jpg', { altText: 'Fachada' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ altText: 'Fachada', width: 320, height: 200 });
    expect(res.body).not.toHaveProperty('storageKey');

    const image = await ctx.prisma.projectImage.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(image.storageKey).toBe(`projects/${projectId}/${image.id}.webp`);
    expect(image.mimeType).toBe('image/webp');

    const filePath = path.join(process.env.UPLOAD_DIR!, image.storageKey);
    expect(existsSync(filePath)).toBe(true);
    const meta = await sharp(filePath).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();

    const project = await ctx.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    expect(project.coverImageId).toBe(image.id);
  });

  it('rejects an executable renamed to .jpg with 415', async () => {
    const fakeExe = Buffer.concat([Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'binary'), Buffer.alloc(2048)]);
    const res = await upload(adminCookie, fakeExe, 'foto.jpg');
    expect(res.status).toBe(415);
    expect(await ctx.prisma.projectImage.count()).toBe(0);
  });

  it('rejects a corrupt image that only has a valid signature', async () => {
    const corrupt = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(4096, 7)]);
    expect((await upload(adminCookie, corrupt, 'rota.jpg')).status).toBe(415);
  });

  it('rejects files over the configured size limit with 413', async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(1024 * 1024 + 10)]);
    expect((await upload(adminCookie, big, 'grande.jpg')).status).toBe(413);
  });

  it('requires a session and the media:upload permission', async () => {
    const image = await jpegWithExif();
    expect((await upload(null, image, 'a.jpg')).status).toBe(401);
    expect((await upload(noRoleCookie, image, 'a.jpg')).status).toBe(403);
  });

  it('rejects unexpected multipart fields and missing files', async () => {
    expect((await upload(adminCookie, await jpegWithExif(), 'a.jpg', { storageKey: '../../x' })).status).toBe(400);
    const noFile = await ctx.http()
      .post(`/api/v1/admin/projects/${projectId}/images`)
      .set('Cookie', adminCookie)
      .field('altText', 'sin archivo');
    expect(noFile.status).toBe(400);
  });

  it('draft images are private; published images are public with safe headers', async () => {
    const uploaded = await upload(adminCookie, await jpegWithExif(), 'a.jpg');
    const url = `/api/v1/media/${uploaded.body.id}`;

    expect((await ctx.http().get(url)).status).toBe(404);
    const staff = await ctx.http().get(url).set('Cookie', adminCookie);
    expect(staff.status).toBe(200);
    expect(staff.headers['cache-control']).toBe('private, no-store');

    await ctx.http().post(`/api/v1/admin/projects/${projectId}/publish`).set('Cookie', adminCookie);

    const anonymous = await ctx.http().get(url);
    expect(anonymous.status).toBe(200);
    expect(anonymous.headers['content-type']).toBe('image/webp');
    expect(anonymous.headers['x-content-type-options']).toBe('nosniff');
    expect(anonymous.headers['cache-control']).toBe('public, max-age=3600');
  });

  it('deleting an image removes the file and clears the cover', async () => {
    const uploaded = await upload(pmCookie, await jpegWithExif(), 'a.jpg');
    const image = await ctx.prisma.projectImage.findUniqueOrThrow({ where: { id: uploaded.body.id } });
    const filePath = path.join(process.env.UPLOAD_DIR!, image.storageKey);

    const del = (cookie: string) =>
      ctx.http().delete(`/api/v1/admin/projects/${projectId}/images/${image.id}`).set('Cookie', cookie);

    expect((await del(noRoleCookie)).status).toBe(403);
    expect((await del(pmCookie)).status).toBe(200);
    expect(existsSync(filePath)).toBe(false);
    expect((await ctx.prisma.project.findUniqueOrThrow({ where: { id: projectId } })).coverImageId).toBeNull();
  });
});
