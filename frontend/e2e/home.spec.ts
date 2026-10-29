import { expect, test } from './fixtures.ts';

test('the home page shows a healthy API and database, and the API version', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Tastebook' })).toBeVisible();
  await expect(page.getByText('API: ok, database: ok')).toBeVisible();
  await expect(page.getByText(/^API version \d+(\.\d+)+$/)).toBeVisible();
});

test('bundles both typefaces and loads nothing from Google', async ({ baseURL, context, page }) => {
  // The specs also run against a preview, so the app's own host is the base URL's, not always localhost.
  const appHost = new URL(baseURL ?? 'http://localhost').hostname;
  const requested: string[] = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    requested.push(url);
    return new URL(url).hostname === appHost ? route.continue() : route.abort();
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tastebook' })).toBeVisible();

  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((font) => font.status === 'loaded')
      .map((font) => font.family.replaceAll('"', ''));
  });
  expect(loadedFamilies).toEqual(expect.arrayContaining(['Instrument Serif', 'Nunito']));
  expect(requested.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
});

test('stays dark whatever colour scheme the phone asks for', async ({ page }) => {
  await page.goto('/');

  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(28, 18, 51)');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  }
});
