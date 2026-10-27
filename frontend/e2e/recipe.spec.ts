import { expect, test } from './fixtures.ts';

test('an unknown recipe shows "not found" through the real API', async ({ page, accessibility }) => {
  await page.goto('/recipes/no-such-recipe');

  await expect(page.getByRole('heading', { name: 'Recipe not found' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await accessibility.check();

  await page.getByRole('link', { name: 'All recipes' }).click();

  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
});
