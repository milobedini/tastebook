// Commits the baselines from a PR's latest Update screenshots run and pushes them as you. Usage: pnpm --filter frontend screenshots:commit <PR number>.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';

type PullRequest = {
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  isCrossRepository: boolean;
  headRefName: string;
  headRefOid: string;
  url: string;
};
type Run = { databaseId: number; headSha: string; url: string };
type Outcome = { exitCode: 0 | 1; message: string };

const repoRoot = join(import.meta.dirname, '..', '..');
const baselinesPath = 'frontend/visual/baselines';

// Typed on the binding, so a call narrows like a throw does.
const refuse: (message: string) => never = (message) => {
  console.error(message);
  process.exit(1);
};

const run = (command: string, args: string[], options: { env?: NodeJS.ProcessEnv; input?: string } = {}) =>
  execFileSync(command, args, { cwd: repoRoot, encoding: 'utf8', ...options }).trim();

const args = process.argv.slice(2);
const prNumber = args.length === 1 && /^[1-9]\d*$/.test(args[0] ?? '') ? args[0] : undefined;
if (prNumber === undefined) {
  refuse('Usage: pnpm --filter frontend screenshots:commit <PR number>');
}

const pr: PullRequest = JSON.parse(
  run('gh', ['pr', 'view', prNumber, '--json', 'state,isCrossRepository,headRefName,headRefOid,url'])
);
if (pr.state !== 'OPEN') {
  refuse(`PR #${prNumber} is ${pr.state.toLowerCase()}, so there's nothing to update.`);
}
if (pr.isCrossRepository) {
  refuse(`PR #${prNumber} comes from a fork. Its author updates its screenshots.`);
}

const [latestRun]: Run[] = JSON.parse(
  run('gh', [
    'run',
    'list',
    '--workflow',
    'update-screenshots.yml',
    '--branch',
    pr.headRefName,
    '--status',
    'success',
    '--limit',
    '1',
    '--json',
    'databaseId,headSha,url'
  ])
);
if (latestRun === undefined) {
  refuse(`No successful Update screenshots run on ${pr.headRefName}. Run the workflow on that branch first.`);
}
if (latestRun.headSha !== pr.headRefOid) {
  refuse(
    `The latest Update screenshots run on ${pr.headRefName} is for ${latestRun.headSha.slice(0, 7)}, but the PR's head is ${pr.headRefOid.slice(0, 7)}. Run the workflow again.`
  );
}

const commitBaselines = (tempDir: string): Outcome => {
  const artifactDir = join(tempDir, 'baselines');
  run('gh', ['run', 'download', `${latestRun.databaseId}`, '--name', 'baselines', '--dir', artifactDir]);

  // Recursive, since the forced-colours project keeps its baselines in a folder of their own.
  const entries = readdirSync(artifactDir, { withFileTypes: true, recursive: true }).filter(
    (entry) => !entry.isDirectory()
  );
  const notScreenshot = entries.find((entry) => !entry.isFile() || !entry.name.endsWith('.png'));
  if (notScreenshot) {
    const name = relative(artifactDir, join(notScreenshot.parentPath, notScreenshot.name));
    return { exitCode: 1, message: `The run's artifact holds ${name}, which isn't a screenshot.` };
  }

  run('git', ['fetch', '--quiet', 'origin', `refs/heads/${pr.headRefName}`]);
  if (run('git', ['rev-parse', 'FETCH_HEAD']) !== pr.headRefOid) {
    return { exitCode: 1, message: `${pr.headRefName} moved since the run. Run the workflow again.` };
  }

  // A temporary index builds the commit without touching the person's checkout, index or branch.
  const env = { ...process.env, GIT_INDEX_FILE: join(tempDir, 'index') };
  const git = (gitArgs: string[], input?: string) => run('git', gitArgs, { env, input });

  git(['read-tree', pr.headRefOid]);
  // Starting empty drops the baseline of a deleted or renamed story.
  git(['rm', '-r', '--cached', '--force', '--quiet', '--ignore-unmatch', baselinesPath]);
  const files = entries.map((entry) => join(entry.parentPath, entry.name));
  const blobs = git(['hash-object', '-w', '--stdin-paths'], files.join('\n')).split('\n');
  const indexInfo = files.map(
    (file, i) => `100644 ${blobs[i]}\t${baselinesPath}/${relative(artifactDir, file).split(sep).join('/')}`
  );
  git(['update-index', '--index-info'], indexInfo.join('\n'));

  const tree = git(['write-tree']);
  if (tree === git(['rev-parse', `${pr.headRefOid}^{tree}`])) {
    return { exitCode: 0, message: "No story's look changed." };
  }
  const commit = git([
    'commit-tree',
    tree,
    '-p',
    pr.headRefOid,
    '-m',
    'Update story screenshots',
    '-m',
    `Baselines from ${latestRun.url}.`
  ]);
  // The hooks check the checkout, not this commit, which changes only PNGs.
  git(['push', '--no-verify', 'origin', `${commit}:refs/heads/${pr.headRefName}`]);
  return { exitCode: 0, message: `Pushed ${commit.slice(0, 7)} to ${pr.headRefName}: ${pr.url}` };
};

const tempDir = mkdtempSync(join(tmpdir(), 'tastebook-screenshots-'));
const outcome = (() => {
  try {
    return commitBaselines(tempDir);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
})();
if (outcome.exitCode === 1) {
  refuse(outcome.message);
}
console.log(outcome.message);
