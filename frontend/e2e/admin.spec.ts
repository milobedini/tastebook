import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

import { expect, test } from './fixtures.ts';
import { newTestAccountEmail, readSignInCode } from './test-accounts.ts';
import { totpCode } from './totp.ts';

const BACKEND = fileURLToPath(new URL('../../backend', import.meta.url));

const signInWithEmailCode = async (page: Page, email: string): Promise<void> => {
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Check your email' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Code' }).fill(await readSignInCode(page.request, email));
  await page.getByRole('button', { name: 'Sign in' }).click();
};

const signUp = async (page: Page): Promise<string> => {
  const email = newTestAccountEmail();
  await page.goto('/sign-in?next=%2Frecipes');
  await signInWithEmailCode(page, email);
  await page.getByRole('textbox', { name: 'Your name' }).fill('Sam');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/recipes$/);
  return email;
};

test('the admin sends someone signed out to sign in', async ({ page }) => {
  await page.goto('/admin/');

  await expect(page).toHaveURL(/\/sign-in\?next=%2Fadmin%2F$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
});

test("the admin isn't there for an account that isn't staff", async ({ page }) => {
  await signUp(page);

  // page.request shares the page's session, and leaves the page on the app for the fixture's axe scan.
  const response = await page.request.get('/admin/');

  expect(response.status()).toBe(404);
});

test('a staff member sets up two-factor sign-in and then signs in with it', async ({ page, accessibility }) => {
  test.skip(Boolean(process.env.PREVIEW_URL), 'make_staff needs the database');
  // Signing in again needs the app's next code: allauth takes each code once.
  test.setTimeout(90_000);
  const email = await signUp(page);
  execFileSync('uv', ['run', 'python', 'manage.py', 'make_staff', email], {
    cwd: BACKEND,
    env: { ...process.env, DJANGO_DEBUG: 'true' }
  });

  await page.goto('/admin/');
  await expect(page.getByRole('heading', { level: 1, name: 'Set up two-factor sign-in' })).toBeVisible();
  await accessibility.check();
  const key = (await page.locator('#content-main code').textContent()) ?? '';
  const setUpWith = totpCode(key);
  await page.getByRole('textbox', { name: 'Code from the app' }).fill(setUpWith);
  await page.getByRole('button', { name: 'Turn on two-factor sign-in' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Save your recovery codes' })).toBeVisible();
  await expect(page.locator('#content-main ol li code')).toHaveCount(10);
  await accessibility.check();
  await page.getByRole('link', { name: 'Open the admin' }).click();

  await expect(page.getByText('Site administration')).toBeVisible();
  await accessibility.check();
  await page.getByRole('button', { name: 'Log out' }).click();

  await page.goto('/admin/');
  await signInWithEmailCode(page, email);
  await expect(page.getByRole('heading', { level: 1, name: 'Enter your two-factor code' })).toBeFocused();
  await accessibility.check();
  await expect.poll(() => totpCode(key), { timeout: 35_000, intervals: [1_000] }).not.toBe(setUpWith);
  await page.getByRole('textbox', { name: 'Code' }).fill(totpCode(key));
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(page.getByText('Site administration')).toBeVisible();
});
