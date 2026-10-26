import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const themeButton = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Theme' }).getByRole('button', { name });

test('bundles both typefaces and loads nothing from Google', async ({ context, page }) => {
  const requested: string[] = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    requested.push(url);
    return new URL(url).hostname === 'localhost' ? route.continue() : route.abort();
  });

  await page.goto('/styleguide');
  await expect(page.getByRole('heading', { level: 1, name: 'Style guide' })).toBeVisible();

  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((font) => font.status === 'loaded')
      .map((font) => font.family.replaceAll('"', ''));
  });
  expect(loadedFamilies).toEqual(expect.arrayContaining(['Bricolage Grotesque Variable', 'Atkinson Hyperlegible']));
  expect(requested.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
});

test('follows the phone in dark mode, and the theme control overrides it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/styleguide');
  const body = page.locator('body');

  await expect(body).toHaveCSS('background-color', 'rgb(13, 20, 36)');

  await themeButton(page, 'Light').click();

  await expect(body).toHaveCSS('background-color', 'rgb(243, 245, 248)');
});

test('has no WCAG 2.2 A or AA violations in either theme', async ({ page }) => {
  await page.goto('/styleguide');

  for (const theme of ['Light', 'Dark']) {
    await themeButton(page, theme).click();
    await expect(themeButton(page, theme)).toHaveAttribute('aria-pressed', 'true');

    const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

    expect(violations).toEqual([]);
  }
});
