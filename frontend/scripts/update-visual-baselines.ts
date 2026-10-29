// Updates the story screenshot baselines that changed. Usage: pnpm --filter frontend test:visual:update, on CI's Linux image.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

type StoryIndex = { entries: Record<string, { id: string; type: 'story' | 'docs' }> };

if (process.platform !== 'linux' || process.env.GITHUB_ACTIONS !== 'true') {
  console.error(
    "Baselines are made on CI's Linux image only, so they match the check. Run the Update screenshots workflow on your branch, then pnpm --filter frontend screenshots:commit <PR number>."
  );
  process.exit(1);
}

const frontendDir = join(import.meta.dirname, '..');
const baselinesDir = join(frontendDir, 'visual', 'baselines');
const run = (command: string, args: string[]) => execFileSync(command, args, { cwd: frontendDir, stdio: 'inherit' });

run('pnpm', ['build-storybook']);

// A deleted or renamed story leaves its baseline behind, and the check fails on an orphan.
const index: StoryIndex = JSON.parse(readFileSync(join(frontendDir, 'storybook-static', 'index.json'), 'utf8'));
const storyIds = new Set(
  Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map(({ id }) => id)
);
// Recursive, since the forced-colours project keeps its baselines in a folder of their own.
const orphans = readdirSync(baselinesDir, { withFileTypes: true, recursive: true })
  .filter((file) => file.isFile() && file.name.endsWith('.png') && !storyIds.has(file.name.slice(0, -'.png'.length)))
  .map((file) => join(file.parentPath, file.name));
orphans.map((path) => rmSync(path));
console.log(orphans.length ? `Removed orphan baselines: ${orphans.join(', ')}` : 'No orphan baselines.');

// Rewriting every shot would churn the ones whose antialiasing varies; changed writes missing shots and rewrites
// only those outside the tolerance.
run('pnpm', ['exec', 'playwright', 'test', '-c', 'playwright.visual.config.ts', '--update-snapshots=changed']);
