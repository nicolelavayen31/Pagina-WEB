import { expect, type APIRequestContext, type Page } from '@playwright/test';

// Must match apps/api/test/e2e/prepare-e2e-db.ts (test-only accounts in the *_test database).
export const ADMIN = { email: 'e2e-admin@test.local', password: 'E2e-Admin-Password-2026' };
export const PM = { email: 'e2e-pm@test.local', password: 'E2e-Manager-Password-2026' };

export async function loginViaUi(page: Page, user: { email: string; password: string }) {
  await page.goto('/admin/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

export async function apiLogin(request: APIRequestContext, user: { email: string; password: string }) {
  const res = await request.post('/api/v1/auth/login', { data: user });
  expect(res.status()).toBe(200);
}

export function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const LONG_DESCRIPTION =
  'Proyecto de remodelación integral que incluyó tabiquería, cielos rasos, instalaciones eléctricas, iluminación LED y acabados de alta calidad.';

/** Creates and (optionally) publishes a project through the API as ADMIN. */
export async function createProject(
  request: APIRequestContext,
  overrides: Record<string, string> = {},
  publish = true,
) {
  await apiLogin(request, ADMIN);
  const slug = overrides.slug ?? uniqueSlug('proyecto');
  const created = await request.post('/api/v1/admin/projects', {
    data: {
      title: 'Proyecto E2E',
      slug,
      summary: 'Resumen del proyecto de prueba end to end.',
      description: LONG_DESCRIPTION,
      category: 'Remodelación',
      location: 'Quito',
      ...overrides,
    },
  });
  expect(created.status()).toBe(201);
  const project = (await created.json()) as { id: string; slug: string };
  if (publish) {
    expect((await request.post(`/api/v1/admin/projects/${project.id}/publish`)).status()).toBe(201);
  }
  return project;
}

/** A tiny valid PNG (1x1 pixel) generated in memory. */
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
