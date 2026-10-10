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

    // Active link; header keeps a single primary action (no button duplicating a menu link).
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Ver proyectos' })).toHaveCount(0);
    await expect(nav.locator('.button')).toHaveCount(1);
    // WhatsApp lives in the floating button only, not repeated in the footer.
    await expect(page.locator('footer').getByRole('link', { name: /WhatsApp/ })).toHaveCount(0);

    // Every gallery photo is a real file that loads.
    const slides = page.locator('.hero__slide img');
    await expect(slides).toHaveCount(5);
    for (const img of await slides.all()) {
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }

    await page.getByRole('link', { name: 'Empezar ahora' }).click();
    await expect(page).toHaveURL(/\/contacto#cotizar/);
  });

  test('home gallery: navigation, indicators, pause and stable height', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('section.hero');
    const dots = page.getByRole('group', { name: 'Elegir imagen' }).getByRole('button');
    await expect(dots).toHaveCount(5);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    const heightBefore = (await hero.boundingBox())!.height;

    await page.getByRole('button', { name: 'Imagen siguiente' }).click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.hero__caption')).toHaveText('Tablero de control de quemador');

    await page.getByRole('button', { name: 'Imagen anterior' }).click();
    await page.getByRole('button', { name: 'Imagen anterior' }).click();
    await expect(dots.nth(4)).toHaveAttribute('aria-current', 'true'); // wraps around

    await dots.nth(2).click();
    await expect(page.locator('.hero__slide[data-active="true"]')).toHaveAttribute('aria-label', /^3 de 5/);
    // Only the visible slide is exposed to assistive technology.
    await expect(page.locator('.hero__slide[aria-hidden="false"]')).toHaveCount(1);

    await page.getByRole('button', { name: 'Pausar presentación' }).click();
    await expect(page.getByRole('button', { name: 'Reanudar presentación' })).toBeVisible();

    expect((await hero.boundingBox())!.height).toBe(heightBefore);
  });

  test('home gallery autoplays, and does not when reduced motion is preferred', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(0, 0); // keep the pointer away from the hero (hover pauses it)
    await expect(page.locator('section.hero')).toHaveAttribute('data-autoplay', 'on');
    await expect(page.locator('.hero__slide[data-active="true"]')).toHaveAttribute('aria-label', /^2 de 5/, { timeout: 9000 });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('section.hero')).toHaveAttribute('data-autoplay', 'off');
    await expect(page.getByRole('button', { name: 'Pausar presentación' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Imagen siguiente' })).toBeVisible();
  });

  test('floating WhatsApp button opens the business chat (public pages only)', async ({ page }) => {
    for (const route of ['/', '/proyectos', '/contacto']) {
      await page.goto(route);
      const fab = page.locator('a.whatsapp-fab');
      await expect(fab).toBeVisible();
      await expect(fab).toHaveAccessibleName(/WhatsApp/);
      const href = await fab.getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\/593979584079\?text=/);
      await expect(fab).toHaveAttribute('target', '_blank');
      await expect(fab).toHaveAttribute('rel', /noopener/);
    }
    await page.goto('/admin/login');
    await expect(page.locator('a.whatsapp-fab')).toHaveCount(0);
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
    // The publication year is not shown: it is not the year the job was done.
    await expect(card.getByText(String(new Date().getFullYear()))).toHaveCount(0);
    await expect(page.getByRole('article').filter({ hasText: `Fachada ${suffix}` })).toHaveCount(0);

    await card.getByRole('link', { name: `Tablero ${suffix}` }).click();
    await expect(page.getByRole('heading', { level: 1, name: `Tablero ${suffix}` })).toBeVisible();
  });

  test('services page: catalogue with photos, no repeated buttons, link to projects', async ({ page }) => {
    await page.goto('/servicios');
    await expect(page.getByRole('heading', { level: 1, name: 'Lo que diseñamos y construimos' })).toBeVisible();

    const cards = page.locator('.service-tile');
    await expect(cards).toHaveCount(3);
    // No call-to-action repeated inside every card.
    await expect(cards.getByRole('link')).toHaveCount(0);
    await expect(cards.getByRole('button')).toHaveCount(0);

    // A catalogue service with a confirmed photo shows it; the photo really loads.
    const pneumatic = cards.filter({ hasText: 'Sistemas neumáticos para camales' });
    const img = pneumatic.locator('img');
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

    // Exactly one quote action in the page body (the closing band) and a distinct link to projects.
    const main = page.locator('main');
    await expect(main.getByRole('link', { name: 'Solicitar cotización' })).toHaveCount(1);
    await main.getByRole('link', { name: 'Ver proyectos realizados' }).click();
    await expect(page).toHaveURL(/\/proyectos$/);
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

    // The floating WhatsApp button must not cover the gallery controls.
    const fab = await page.locator('a.whatsapp-fab').boundingBox();
    const next = await page.getByRole('button', { name: 'Imagen siguiente' }).boundingBox();
    if (fab && next) {
      const overlaps = next.x < fab.x + fab.width && next.x + next.width > fab.x && next.y < fab.y + fab.height && next.y + next.height > fab.y;
      expect(overlaps).toBe(false);
    }

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
