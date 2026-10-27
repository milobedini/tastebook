import type { Page } from '@playwright/test';

import type { components } from '../src/api/schema.js';
import { expect, test } from './fixtures.ts';

type Recipe = components['schemas']['Recipe'];
type RecipeSummary = components['schemas']['RecipeSummary'];

// A fresh database has no recipes until the catalogue loads, so these answer the API with a recipe whose long
// words and lists are the most likely to push the page sideways.
const recipe: Recipe = {
  id: 1,
  slug: 'slow-roasted-pork-shoulder',
  title: 'Slow-roasted pork shoulder with crackling, apple sauce and Yorkshire puddings',
  description: 'A Sunday roast for a crowd, with the crackling made the night before and the gravy from the pan.',
  cuisines: [
    { slug: 'british', name: 'British' },
    { slug: 'french', name: 'French' }
  ],
  courses: [
    { slug: 'main', name: 'Main' },
    { slug: 'side', name: 'Side' }
  ],
  difficulty: 'hard',
  prep_minutes: 45,
  cook_minutes: 375,
  extra_minutes: 720,
  extra_label: 'dry-brining overnight in the fridge',
  total_minutes: 1140,
  servings: null,
  yield_amount: 12,
  yield_unit: 'generous portions with leftovers',
  equipment: [
    { slug: 'oven', name: 'Oven' },
    { slug: 'hob', name: 'Hob' },
    { slug: 'food-processor', name: 'Food processor' },
    { slug: 'stand-mixer', name: 'Stand mixer' }
  ],
  one_pot: true,
  source: 'Adapted from https://en.wikibooks.org/wiki/Cookbook:Roast_Pork_Shoulder_with_Crackling (CC BY-SA 4.0)'
};

const summary: RecipeSummary = {
  id: recipe.id,
  slug: recipe.slug,
  title: recipe.title,
  description: recipe.description,
  cuisines: recipe.cuisines,
  difficulty: recipe.difficulty,
  total_minutes: recipe.total_minutes
};

const sidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.use({ viewport: { width: 375, height: 812 } });

test('the recipe list fits a 375 px phone screen without scrolling sideways', async ({ page }) => {
  await page.route('**/api/recipes/', (route) => route.fulfill({ json: [summary] }));

  await page.goto('/recipes');

  await expect(page.getByText('19 hr · Hard · British, French')).toBeVisible();
  expect(await sidewaysScroll(page)).toBe(0);
});

test('a recipe page fits a 375 px phone screen without scrolling sideways', async ({ page }) => {
  await page.route(`**/api/recipes/${recipe.slug}/`, (route) => route.fulfill({ json: recipe }));

  await page.goto(`/recipes/${recipe.slug}`);

  await expect(page.getByText('generous portions with leftovers')).toBeVisible();
  expect(await sidewaysScroll(page)).toBe(0);
});
