import type { Page } from '@playwright/test';

import { expect, test } from './fixtures.ts';

const themeButton = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Theme' }).getByRole('button', { name });

test('bundles both typefaces and loads nothing from Google', async ({ baseURL, context, page }) => {
  // The specs also run against a preview, so the app's own host is the base URL's, not always localhost.
  const appHost = new URL(baseURL ?? 'http://localhost').hostname;
  const requested: string[] = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    requested.push(url);
    return new URL(url).hostname === appHost ? route.continue() : route.abort();
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

test('has no WCAG 2.2 A or AA violations in either theme', async ({ page, accessibility }) => {
  await page.goto('/styleguide');

  for (const theme of ['Light', 'Dark']) {
    await themeButton(page, theme).click();
    await expect(themeButton(page, theme)).toHaveAttribute('aria-pressed', 'true');
    await accessibility.check();
  }
});

test('has no WCAG 2.2 A or AA violations with the dialog open', async ({ page, accessibility }) => {
  await page.goto('/styleguide');

  await page
    .getByRole('region', { name: "Confirming something you can't undo" })
    .getByRole('button', { name: 'Delete account' })
    .click();
  await expect(page.getByRole('alertdialog', { name: 'Delete your account?' })).toBeVisible();

  await accessibility.check();
});

test('makes every control at least 44 px tall', async ({ page }) => {
  await page.goto('/styleguide');
  await expect(page.getByRole('heading', { level: 1, name: 'Style guide' })).toBeVisible();

  const shortControls = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, [role="checkbox"]')]
      .filter((control) => control.checkVisibility())
      .map((control) => {
        // A checkbox's target is its whole row, the label around it.
        const target = control.getAttribute('role') === 'checkbox' ? (control.closest('label') ?? control) : control;
        return {
          name: control.getAttribute('aria-label') ?? control.textContent ?? control.outerHTML,
          height: target.getBoundingClientRect().height
        };
      })
      .filter((control) => control.height < 44)
  );

  expect(shortControls).toEqual([]);
});
