import { expect, test } from '@playwright/test';

test('the home page shows a healthy API and database, and the API version', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Tastebook' })).toBeVisible();
  await expect(page.getByText('API: ok, database: ok')).toBeVisible();
  await expect(page.getByText(/^API version \d+(\.\d+)+$/)).toBeVisible();
});
