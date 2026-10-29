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
  expect(loadedFamilies).toEqual(expect.arrayContaining(['Bricolage Grotesque Variable', 'Atkinson Hyperlegible']));
  expect(requested.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
});

test('follows the phone between dark and light', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('body');

  for (const [colorScheme, background] of [
    ['dark', 'rgb(13, 20, 36)'],
    ['light', 'rgb(243, 245, 248)']
  ] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(body).toHaveCSS('background-color', background);
  }
});
