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

type WebManifest = {
  name: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: { src: string }[];
};

test('can be added to a home screen with the mark as its icon', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1c1233');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest: WebManifest = await (await page.request.get(manifestHref ?? '')).json();
  expect(manifest).toMatchObject({
    name: 'Tastebook',
    display: 'standalone',
    theme_color: '#1c1233',
    background_color: '#1c1233'
  });

  const iconLinks = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  const icons = [...iconLinks, ...manifest.icons.map(({ src }) => src)];
  expect(icons).toEqual(
    expect.arrayContaining(['/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'])
  );
  const contentTypes = await Promise.all(
    icons.map(async (href) => (await page.request.get(href)).headers()['content-type'])
  );
  expect(contentTypes).toEqual(icons.map(() => expect.stringMatching(/^image\//)));
});
