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
