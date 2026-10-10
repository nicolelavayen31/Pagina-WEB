import { expect, test } from '@playwright/test';
import { createProject, uniqueSlug } from './fixtures';

test.describe('Public site', () => {
  test('home lists services coming from the API and sends security headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    const headers = response!.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-powered-by']).toBeUndefined();

    await expect(page.getByRole('heading', { name: 'Mantenimiento integral' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remodelaciones' })).toBeVisible();

    // Active link and real photos (hero + the service that has a photo) actually load.
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
    for (const img of await page.locator('.hero img, .service-card img').all()) {
      await expect(img).toBeVisible();
      expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    expect(await page.locator('.service-card img').count()).toBeGreaterThan(0);

    await page.getByRole('link', { name: 'Empezar ahora' }).click();
    await expect(page).toHaveURL(/\/contacto#cotizar/);
  });

  test('quote form persists a request and shows a success message', async ({ page, request }) => {
    const email = `cliente-${Date.now()}@example.com`;
    await page.goto('/contacto');

    await page.getByLabel('Nombre completo').fill('Cliente E2E');
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Teléfono').fill('+593 99 000 1111');
    await page.getByLabel('Ubicación del proyecto').fill('Guayaquil');
    await page.getByLabel('Tipo de servicio').selectOption({ label: 'Remodelaciones' });
    await page.getByLabel('Presupuesto aproximado').selectOption('FROM_5K_TO_20K');
    await page.getByLabel('Descripción de la necesidad').fill('Remodelación completa de una oficina de 120 m2 con cambio de pisos.');
    await page.getByLabel(/acepto la/).check();
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    await expect(page.getByRole('status')).toContainText('registrada correctamente');

    // Verify real persistence through the admin API.
    await request.post('/api/v1/auth/login', { data: { email: 'e2e-admin@test.local', password: 'E2e-Admin-Password-2026' } });
    const leads = await (await request.get('/api/v1/admin/leads')).json();
    const lead = leads.items.find((item: { email: string }) => item.email === email);
    expect(lead).toMatchObject({ budgetRange: 'FROM_5K_TO_20K', status: 'NEW', service: { name: 'Remodelaciones' } });
  });

  test('quote page keeps the exact same fields with the new two-column layout', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.getByRole('heading', { level: 1, name: 'Solicita una cotización sin compromiso' })).toBeVisible();
    await expect(page.getByRole('list').filter({ hasText: 'Cuéntanos qué necesitas' }).getByRole('listitem')).toHaveCount(3);

    const names = await page.locator('form.form-grid').evaluate((form: HTMLFormElement) =>
      Array.from(form.elements)
        .map((el) => (el as HTMLInputElement).name)
        .filter(Boolean),
    );
    expect(names).toEqual(['name', 'company', 'email', 'phone', 'location', 'serviceId', 'budgetRange', 'description', 'website', 'privacyAccepted']);

    for (const label of ['Nombre completo', 'Empresa (opcional)', 'Correo electrónico', 'Teléfono', 'Ubicación del proyecto', 'Tipo de servicio', 'Presupuesto aproximado', 'Descripción de la necesidad']) {
      await expect(page.getByLabel(label)).toBeVisible();
    }

    const name = await page.getByLabel('Nombre completo').boundingBox();
    const company = await page.getByLabel('Empresa (opcional)').boundingBox();
    expect(name!.height).toBeGreaterThanOrEqual(52);
    expect(await page.getByLabel('Nombre completo').evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
    const viewport = page.viewportSize()!;
    if (viewport.width > 640) {
      expect(Math.abs(name!.y - company!.y)).toBeLessThan(2); // same row
    } else {
      expect(company!.y).toBeGreaterThan(name!.y); // stacked
    }
  });

  test('quote form requires privacy consent before submitting', async ({ page }) => {
    await page.goto('/contacto');
    const consent = page.getByLabel(/acepto la/);
    await expect(consent).toHaveAttribute('required', '');
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('project descriptions cannot inject HTML or scripts (XSS)', async ({ page, request }) => {
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
    const project = await createProject(request, {
      slug: uniqueSlug('xss'),
      description: `${payload} Descripción con suficiente longitud para cumplir la validación mínima del proyecto.`,
    });

    let dialogOpened = false;
    page.on('dialog', async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });

    await page.goto(`/proyectos/${project.slug}`);
    await expect(page.getByText('<script>window.__xss=2</script>', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(await page.locator('main img[src="x"]').count()).toBe(0);
    expect(dialogOpened).toBe(false);
  });

  test('projects catalogue filters by real categories and shows the data row', async ({ page, request }) => {
    const suffix = Date.now().toString(36);
    const electric = `Eléctrico ${suffix}`;
    const painting = `Pintura ${suffix}`;
    await createProject(request, { slug: uniqueSlug('cat-a'), title: `Tablero ${suffix}`, category: electric, location: 'Cuenca' });
    await createProject(request, { slug: uniqueSlug('cat-b'), title: `Fachada ${suffix}`, category: painting, location: 'Loja' });

    await page.goto('/proyectos');
    await expect(page.getByRole('heading', { level: 1, name: 'Obras que hablan por nosotros' })).toBeVisible();
    const filters = page.getByRole('navigation', { name: 'Filtrar por categoría' });
    await expect(filters.getByRole('link', { name: 'Todos' })).toHaveAttribute('aria-current', 'page');

    await filters.getByRole('link', { name: electric }).click();
    await expect(page).toHaveURL(/categoria=/);
    await expect(filters.getByRole('link', { name: electric })).toHaveAttribute('aria-current', 'page');

    const card = page.getByRole('article').filter({ hasText: `Tablero ${suffix}` });
    await expect(card).toBeVisible();
    await expect(card.getByText(electric)).toBeVisible();
    await expect(card.getByText('Cuenca')).toBeVisible();
    await expect(card.getByText(String(new Date().getFullYear()))).toBeVisible();
    await expect(page.getByRole('article').filter({ hasText: `Fachada ${suffix}` })).toHaveCount(0);

    await card.getByRole('link', { name: `Tablero ${suffix}` }).click();
    await expect(page.getByRole('heading', { level: 1, name: `Tablero ${suffix}` })).toBeVisible();
  });

  test('drafts are not visible on the public site', async ({ page, request }) => {
    const draft = await createProject(request, { slug: uniqueSlug('borrador'), title: 'Borrador secreto' }, false);
    const response = await page.goto(`/proyectos/${draft.slug}`);
    expect(response?.status()).toBe(404);
    await page.goto('/proyectos');
    await expect(page.getByText('Borrador secreto')).toHaveCount(0);
  });

  test('home has no horizontal overflow on a phone @mobile', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole('link', { name: 'Empezar ahora' })).toBeVisible();

    // Phone layout: the menu collapses behind an accessible toggle.
    const toggle = page.getByRole('button', { name: 'Abrir menú' });
    if (await toggle.isVisible()) {
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Servicios' })).toBeVisible();
    }
  });
});
