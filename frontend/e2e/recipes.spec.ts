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

test('filters and clears them through the real API', async ({ page, accessibility }) => {
  await page.goto('/recipes?q=xyzzy');

  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('group', { name: 'Cuisine' }).getByRole('button', { name: 'Italian' }).click();
  await page.getByRole('group', { name: 'Total time' }).getByRole('button', { name: 'Up to 30 min' }).click();

  await expect(page).toHaveURL(/\/recipes\?q=xyzzy&cuisine=italian&max_total=30$/);
  await expect(page.getByText('No recipes match “xyzzy” with these filters.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove filter: Italian' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove filter: Total up to 30 min' })).toBeVisible();
  await accessibility.check();

  // The chip row's "Clear filters" comes first; the empty state's is the last.
  await page.getByRole('button', { name: 'Clear filters' }).last().click();

  await expect(page).toHaveURL(/\/recipes\?q=xyzzy$/);
  await expect(page.getByText('No recipes match “xyzzy”.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
