import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';

const script = join(import.meta.dirname, 'ignored-build-step.sh');

const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Tastebook',
  GIT_AUTHOR_EMAIL: 'tests@tastebook.invalid',
  GIT_COMMITTER_NAME: 'Tastebook',
  GIT_COMMITTER_EMAIL: 'tests@tastebook.invalid'
};

const repoFiles = [
  'frontend/src/main.tsx',
  'backend/config/settings.py',
  'docs/architecture.md',
  'specs/TAS-1.md',
  '.github/workflows/ci.yml',
  'tools/backup/dumps.ts',
  'tools/vercel/ignored-build-step.sh',
  'AGENTS.md',
  'vercel.json',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml'
];

const repos: string[] = [];

after(() => {
  for (const repo of repos) {
    rmSync(repo, { recursive: true, force: true });
  }
});

const git = (repo: string, ...args: string[]): string => {
  const result = spawnSync('git', args, { cwd: repo, env: gitEnv, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

const commit = (repo: string, paths: string[], message: string): string => {
  for (const path of paths) {
    mkdirSync(join(repo, dirname(path)), { recursive: true });
    writeFileSync(join(repo, path), `${message}\n`);
  }
  git(repo, 'add', '--all');
  git(repo, 'commit', '--quiet', '--message', message);
  return git(repo, 'rev-parse', 'HEAD');
};

// A repo with every path deployed once, then the given commits on top; returns the repo and the deployed commit.
const repoWith = (commits: string[][]): { repo: string; deployed: string } => {
  const repo = mkdtempSync(join(tmpdir(), 'ignored-build-step-'));
  repos.push(repo);
  git(repo, 'init', '--quiet');
  const deployed = commit(repo, repoFiles, 'Deployed');
  for (const [index, paths] of commits.entries()) {
    commit(repo, paths, `Change ${index + 1}`);
  }
  return { repo, deployed };
};

type Previous = 'deployed commit' | 'empty' | 'missing from the clone';

const runFrom = (cwd: string, previousSha: string): 'builds' | 'skips' => {
  const result = spawnSync('bash', [script], { cwd, env: { ...gitEnv, VERCEL_GIT_PREVIOUS_SHA: previousSha } });
  assert.ok(result.status === 0 || result.status === 1, `exited ${result.status}: ${result.stderr}`);
  return result.status === 0 ? 'skips' : 'builds';
};

const previousSha = (previous: Previous, deployed: string): string =>
  ({
    'deployed commit': deployed,
    empty: '',
    'missing from the clone': '0123456789abcdef0123456789abcdef01234567'
  })[previous];

describe('ignored build step', () => {
  const cases: [string, string[][], Previous, 'builds' | 'skips'][] = [
    ['only docs changed', [['docs/architecture.md']], 'deployed commit', 'skips'],
    [
      'only specs, AGENTS.md, workflows and the backup tool changed',
      [['specs/TAS-1.md', 'AGENTS.md', '.github/workflows/ci.yml', 'tools/backup/dumps.ts']],
      'deployed commit',
      'skips'
    ],
    ['nothing changed', [], 'deployed commit', 'skips'],
    ['the frontend changed', [['frontend/src/main.tsx']], 'deployed commit', 'builds'],
    ['the backend changed', [['backend/config/settings.py']], 'deployed commit', 'builds'],
    ['vercel.json changed', [['vercel.json']], 'deployed commit', 'builds'],
    ['package.json changed', [['package.json']], 'deployed commit', 'builds'],
    ['the lockfile changed', [['pnpm-lock.yaml']], 'deployed commit', 'builds'],
    ['the workspace changed', [['pnpm-workspace.yaml']], 'deployed commit', 'builds'],
    ['this check changed', [['tools/vercel/ignored-build-step.sh']], 'deployed commit', 'builds'],
    ['a new file in the frontend', [['frontend/src/new-page.tsx']], 'deployed commit', 'builds'],
    [
      'the frontend changed, then a later commit changed only docs',
      [['frontend/src/main.tsx'], ['docs/architecture.md']],
      'deployed commit',
      'builds'
    ],
    ['only docs changed, on the first deployment of the branch', [['docs/architecture.md']], 'empty', 'builds'],
    [
      'only docs changed, since a commit the clone lacks',
      [['docs/architecture.md']],
      'missing from the clone',
      'builds'
    ]
  ];

  for (const [label, commits, previous, expected] of cases) {
    it(`${expected === 'builds' ? 'builds' : 'skips the build'} when ${label}`, () => {
      const { repo, deployed } = repoWith(commits);
      assert.equal(runFrom(repo, previousSha(previous, deployed)), expected);
    });
  }
});
