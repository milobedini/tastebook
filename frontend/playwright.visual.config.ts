import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);

// Screenshots every story in the built Storybook (storybook-static) against its committed baseline.
export default defineConfig({
  testDir: './visual',
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  outputDir: 'test-results/visual',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0, // a flaky shot is a bug to fix, not to retry
  updateSnapshots: 'none', // a missing baseline fails; only --update-snapshots=all writes them
  reporter: isCi ? [['list'], ['html', { outputFolder: 'playwright-report/visual', open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:6007',
    reducedMotion: 'reduce',
    screenshot: 'off',
    trace: 'off'
  },
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css' } },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }
    }
  ],
  webServer: {
    command: 'pnpm exec vite preview --outDir storybook-static --port 6007 --strictPort',
    url: 'http://localhost:6007/index.json',
    reuseExistingServer: !isCi
  }
});
