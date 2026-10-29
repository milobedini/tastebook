// Regenerates every story's screenshot baseline. Usage: pnpm --filter frontend test:visual:update, on CI's Linux image.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

if (process.platform !== 'linux' || process.env.GITHUB_ACTIONS !== 'true') {
  console.error(
    "Baselines are made on CI's Linux image only, so they match the check. Run the Update screenshots workflow on your branch."
  );
  process.exit(1);
}

const frontendDir = join(import.meta.dirname, '..');
const run = (command: string, args: string[]) => execFileSync(command, args, { cwd: frontendDir, stdio: 'inherit' });

run('pnpm', ['build-storybook']);
// Starting empty leaves no orphan baseline behind a deleted or renamed story.
rmSync(join(frontendDir, 'visual', 'baselines'), { recursive: true, force: true });
run('pnpm', ['exec', 'playwright', 'test', '-c', 'playwright.visual.config.ts', '--update-snapshots=all']);
