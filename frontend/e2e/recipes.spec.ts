import { expect, test } from '@playwright/test';

test('the home page links to the recipes page, which loads from the real API', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Browse recipes' }).click();

  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
  // Accepts either state, so a local database that already has recipes doesn't break the check.
  await expect(page.getByText('No recipes yet.').or(page.getByRole('list'))).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
