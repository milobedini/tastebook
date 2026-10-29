import { expect, test } from './fixtures.ts';

// docs/design.md (Rules): under forced colours every drawn piece takes a system colour. The fixture's axe check runs
// on each page at the end of its test.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
});

test('home under forced colours draws the squiggle in the heading text colour', async ({ page }, testInfo) => {
  await page.goto('/');

  const heading = page.getByRole('heading', { level: 1, name: 'Tastebook' });
  await expect(heading).toBeVisible();
  const headingColour = await heading.evaluate((element) => getComputedStyle(element).color);
  const squiggleStroke = await heading.locator('svg path').evaluate((path) => getComputedStyle(path).stroke);
  expect(squiggleStroke).toBe(headingColour);

  await testInfo.attach('home under forced colours', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
});

test('not found under forced colours', async ({ page }, testInfo) => {
  await page.goto('/no-such-page');

  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();

  await testInfo.attach('not found under forced colours', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
});

test('the recipe list on a laptop under forced colours keeps a border on a chosen filter chip', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/recipes?cuisine=italian');

  const cuisine = page.getByRole('complementary', { name: 'Filters' }).getByRole('group', { name: 'Cuisine' });
  const italian = cuisine.getByRole('button', { name: 'Italian' });
  await expect(italian).toHaveAttribute('aria-pressed', 'true');
  expect(await italian.evaluate((chip) => getComputedStyle(chip).borderTopColor)).not.toBe('rgba(0, 0, 0, 0)');

  await testInfo.attach('recipe list under forced colours', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
  // The column sits below the fold, so the pressed chip gets a shot of its own.
  await testInfo.attach('pressed cuisine chip under forced colours', {
    body: await cuisine.screenshot(),
    contentType: 'image/png'
  });
});
