import { expect, test } from './fixtures.ts';

test('an unknown recipe shows "not found" through the real API', async ({ page, accessibility }) => {
  await page.goto('/recipes/no-such-recipe');

  await expect(page.getByRole('heading', { name: 'Recipe not found' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await accessibility.check();

  await page.getByRole('link', { name: 'All recipes' }).click();

  await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();
});

test('changing the servings scales a catalogue recipe through the real API', async ({ page, accessibility }) => {
  await page.goto('/recipes/spanish-tortilla');

  const ingredients = page.getByRole('region', { name: 'Ingredients' });
  await expect(ingredients.getByRole('status')).toHaveText('Serves 6');
  await accessibility.check();

  const more = ingredients.getByRole('button', { name: 'More servings' });
  await more.click();
  await more.click();
  await more.click();

  await expect(ingredients.getByRole('status')).toHaveText('Serves 9');
  await expect(ingredients.getByRole('listitem')).toHaveText([
    '225 ml olive oil',
    '900 g potatoes, floury, peeled and thinly sliced',
    '1–2 onion, thinly sliced',
    '9 eggs',
    '1.5 tsp salt'
  ]);
});
