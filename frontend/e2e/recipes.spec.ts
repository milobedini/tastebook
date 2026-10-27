import { expect, test } from './fixtures.ts';

test('the home page links to the recipes page, which loads from the real API', async ({ page, accessibility }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Browse recipes' })).toBeVisible();
  await accessibility.check();

  await page.getByRole('link', { name: 'Browse recipes' }).click();

  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
  // Accepts either state, so a local database that already has recipes doesn't break the check.
  await expect(page.getByText('No recipes yet.').or(page.getByRole('list').first())).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a search with no matches says so through the real API', async ({ page }) => {
  await page.goto('/recipes');

  await page.getByRole('searchbox', { name: 'Search recipes' }).fill('xyzzy');

  await expect(page).toHaveURL(/\/recipes\?q=xyzzy$/);
  await expect(page.getByText('No recipes match “xyzzy”.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('filters by cuisine through the real API', async ({ page }) => {
  await page.goto('/recipes');

  await page.getByRole('combobox', { name: 'Cuisine' }).selectOption('Italian');

  await expect(page).toHaveURL(/\/recipes\?cuisine=italian$/);
  // Accepts either state, so a local database that already has Italian recipes doesn't break the check.
  await expect(page.getByText('No Italian recipes yet.').or(page.getByRole('list').first())).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
