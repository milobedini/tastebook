import type { Page } from '@playwright/test';

import { expect, test } from './fixtures.ts';
import { newTestAccountEmail, readSignInCode } from './test-accounts.ts';

type Accessibility = { check: () => Promise<void> };

// Both steps are scanned, since the fixture only scans the page a test ends on.
const signInFromTheBar = async (page: Page, accessibility: Accessibility, email: string): Promise<void> => {
  await page.getByRole('banner').getByRole('link', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await accessibility.check();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Check your email' })).toBeFocused();
  await accessibility.check();
  await page.getByRole('textbox', { name: 'Code' }).fill(await readSignInCode(page.request, email));
  await page.getByRole('button', { name: 'Sign in' }).click();
};

test('a new test account signs in from a recipe, signs out and signs in again', async ({ page, accessibility }) => {
  const email = newTestAccountEmail();
  await page.goto('/recipes/baguette');
  await expect(page.getByRole('heading', { level: 1, name: 'Baguette' })).toBeVisible();

  await signInFromTheBar(page, accessibility, email);

  await expect(page).toHaveURL(/\/recipes\/baguette$/);
  const account = page.getByRole('banner').getByRole('button', { name: 'Account' });
  await expect(account).toBeVisible();

  await account.click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(page).toHaveURL(/\/recipes\/baguette$/);

  await signInFromTheBar(page, accessibility, email);

  await expect(page).toHaveURL(/\/recipes\/baguette$/);
  await expect(account).toBeVisible();
});
