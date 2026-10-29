import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);

// Screenshots every story in the built Storybook (storybook-static) against its committed baseline, once as it
// looks and once under forced colours.
export default defineConfig({
  testDir: './visual',
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  outputDir: 'test-results/visual',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0, // a flaky shot is a bug to fix, not to retry
  updateSnapshots: 'none', // a missing baseline fails; only test:visual:update writes them
  reporter: isCi ? [['list'], ['html', { outputFolder: 'playwright-report/visual', open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:6007',
    reducedMotion: 'reduce',
    screenshot: 'off',
    trace: 'off'
  },
  expect: {
    // A few antialiased edge pixels can vary between runs of the same image; keep this under 8, the pixels a 2px
    // change to the smallest corner token (--radius-check) moves, so a real change still fails.
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixels: 4 }
  },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }
    },
    {
      // docs/design.md (Rules: Shape, State) says chosen states keep their icon and controls their outline here.
      name: 'forced-colours',
      snapshotPathTemplate: '{testDir}/baselines/forced-colours/{arg}{ext}',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        forcedColors: 'active'
      }
    }
  ],
  webServer: {
    command: 'pnpm exec vite preview --outDir storybook-static --port 6007 --strictPort',
    url: 'http://localhost:6007/index.json',
    reuseExistingServer: !isCi
  }
});
