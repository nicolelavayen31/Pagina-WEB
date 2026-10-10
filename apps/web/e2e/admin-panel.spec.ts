import { expect, test } from '@playwright/test';
import { ADMIN, LONG_DESCRIPTION, loginViaUi, PM, PNG_1PX, uniqueSlug } from './fixtures';

test.describe('Admin panel', () => {
  test('protected routes redirect to the login page without a session', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fdashboard/);
  });

  test('wrong credentials show a generic error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    // Next.js also renders an empty route announcer with role="alert", so match by text.
    await expect(page.getByRole('alert').filter({ hasText: 'Correo o contraseña incorrectos.' })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('a forged session cookie does not grant access', async ({ page, context }) => {
    await context.addCookies([{ name: 'session_token', value: 'forged', url: 'http://localhost:3100' }]);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin: create, edit, upload an image, publish and see it on the public site', async ({ page }) => {
    const slug = uniqueSlug('ui');
    await loginViaUi(page, ADMIN);
    await expect(page.getByTestId('dashboard-stats')).toBeVisible();

    await page.getByRole('link', { name: 'Proyectos' }).click();
    await page.getByRole('link', { name: 'Nuevo proyecto' }).click();
    await page.getByLabel('Título').fill('Edificio corporativo E2E');
    await page.getByLabel('Slug (URL)').fill(slug);
    await page.getByLabel('Categoría').fill('Mantenimiento');
    await page.getByLabel('Ubicación').fill('Cuenca');
    await page.getByLabel('Resumen').fill('Mantenimiento integral de un edificio corporativo.');
    await page.getByLabel('Descripción').fill(LONG_DESCRIPTION);
    await page.getByRole('button', { name: 'Crear borrador' }).click();

    await expect(page.getByTestId('project-status')).toHaveText('Borrador');

    await page.getByLabel(/Nueva imagen/).setInputFiles({ name: 'fachada.png', mimeType: 'image/png', buffer: PNG_1PX });
    await page.getByLabel('Texto alternativo').fill('Fachada del edificio');
    await page.getByRole('button', { name: 'Subir imagen' }).click();
    await expect(page.getByRole('status')).toHaveText('Imagen subida.');
    await expect(page.getByAltText('Fachada del edificio')).toBeVisible();

    await page.getByRole('button', { name: 'Publicar' }).click();
    await expect(page.getByTestId('project-status')).toHaveText('Publicado');

    await page.goto(`/proyectos/${slug}`);
    await expect(page.getByRole('heading', { name: 'Edificio corporativo E2E' })).toBeVisible();
    const cover = page.getByAltText('Fachada del edificio');
    await expect(cover).toBeVisible();
    expect(await cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test('admin sees and updates quote requests', async ({ page, request }) => {
    const email = `panel-${Date.now()}@example.com`;
    const created = await request.post('/api/v1/leads', {
      data: {
        name: 'Lead del panel',
        email,
        phone: '0999999999',
        location: 'Loja',
        description: 'Necesito impermeabilizar la terraza de mi casa este mes.',
        privacyAccepted: true,
      },
    });
    expect(created.status()).toBe(201);

    await loginViaUi(page, ADMIN);
    await page.getByRole('link', { name: 'Cotizaciones' }).click();
    const row = page.getByRole('row').filter({ hasText: email });
    await expect(row).toBeVisible();
    await row.getByRole('combobox').selectOption('CONTACTED');
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: email }).getByRole('combobox')).toHaveValue('CONTACTED');
  });

  test('project manager: limited menu, can draft but cannot publish', async ({ page }) => {
    await loginViaUi(page, PM);
    const nav = page.getByRole('navigation', { name: 'Secciones del panel' });
    await expect(nav.getByRole('link', { name: 'Proyectos' })).toBeVisible();
    for (const hidden of ['Cotizaciones', 'Servicios', 'Usuarios', 'Auditoría']) {
      await expect(nav.getByRole('link', { name: hidden })).toHaveCount(0);
    }

    await page.goto('/admin/proyectos/nuevo');
    await page.getByLabel('Título').fill('Borrador del gestor');
    await page.getByLabel('Slug (URL)').fill(uniqueSlug('pm'));
    await page.getByLabel('Categoría').fill('Obra civil');
    await page.getByLabel('Ubicación').fill('Ambato');
    await page.getByLabel('Resumen').fill('Proyecto preparado por el gestor de proyectos.');
    await page.getByLabel('Descripción').fill(LONG_DESCRIPTION);
    await page.getByRole('button', { name: 'Crear borrador' }).click();

    await expect(page.getByTestId('project-status')).toHaveText('Borrador');
    await expect(page.getByRole('button', { name: 'Publicar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar', exact: true })).toHaveCount(0);
    await expect(page.getByText('La publicación la realiza un administrador.')).toBeVisible();

    // Even calling the API directly with the PM session is refused.
    const projectId = page.url().split('/').pop();
    const forced = await page.request.post(`/api/v1/admin/projects/${projectId}/publish`);
    expect(forced.status()).toBe(403);
  });

  test('logout ends the session on the server', async ({ page }) => {
    await loginViaUi(page, ADMIN);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    const me = await page.request.get('/api/v1/auth/me');
    expect(me.status()).toBe(401);
  });
});
