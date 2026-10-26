// Turns the Playwright and Lighthouse results from a preview check into the Markdown the workflow posts on the PR.
// Usage: node scripts/preview-checks-report.ts <run URL>, from frontend/ after both checks have run.
import { existsSync, readFileSync } from 'node:fs';
import { stripVTControlCharacters } from 'node:util';

type PlaywrightSpec = {
  title: string;
  file: string;
  line: number;
  ok: boolean;
  tests: { results: { error?: { message?: string } }[] }[];
};
type PlaywrightSuite = { specs: PlaywrightSpec[]; suites?: PlaywrightSuite[] };
type PlaywrightResults = {
  suites: PlaywrightSuite[];
  errors: { message?: string }[];
  stats: { expected: number; unexpected: number; flaky: number; skipped: number };
};

type LighthouseRun = { url: string; isRepresentativeRun: boolean; summary: Record<string, number> };
type LighthouseAssertion = [string, { minScore: number }];
type LighthouseConfig = { ci: { assert: { assertions: Record<string, LighthouseAssertion> } } };

const categories = [
  { id: 'performance', name: 'Performance' },
  { id: 'accessibility', name: 'Accessibility' },
  { id: 'best-practices', name: 'Best Practices' },
  { id: 'seo', name: 'SEO' }
];

const readJson = <T>(path: string): T | undefined =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : undefined;

const allSpecs = (suites: PlaywrightSuite[]): PlaywrightSpec[] =>
  suites.flatMap((suite) => [...suite.specs, ...allSpecs(suite.suites ?? [])]);

const firstError = (spec: PlaywrightSpec): string => {
  const message = spec.tests.flatMap(({ results }) => results).find(({ error }) => error?.message)?.error?.message;
  return stripVTControlCharacters(message ?? 'No error message.').slice(0, 1500);
};

const describeFailure = (spec: PlaywrightSpec): string =>
  `<details><summary><code>${spec.file}:${spec.line}</code> ${spec.title}</summary>\n\n\`\`\`text\n${firstError(spec)}\n\`\`\`\n\n</details>`;

const playwrightSection = (results: PlaywrightResults | undefined): { passed: boolean; markdown: string } => {
  if (!results) {
    return { passed: false, markdown: '### End to end and axe\n\nPlaywright wrote no results: see the run’s log.' };
  }
  const failures = allSpecs(results.suites).filter(({ ok }) => !ok);
  const runErrors = results.errors.map(({ message }) => stripVTControlCharacters(message ?? '').slice(0, 1500));
  const { expected, unexpected, flaky, skipped } = results.stats;
  const counts = `${expected} passed · ${unexpected} failed · ${flaky} flaky · ${skipped} skipped`;
  const details = [...failures.map(describeFailure), ...runErrors.map((message) => `\`\`\`text\n${message}\n\`\`\``)];
  return {
    passed: failures.length === 0 && runErrors.length === 0,
    markdown: ['### End to end and axe', counts, ...details].join('\n\n')
  };
};

const lighthouseSection = (
  runs: LighthouseRun[] | undefined,
  config: LighthouseConfig | undefined
): { passed: boolean; markdown: string } => {
  const representative = (runs ?? []).filter(({ isRepresentativeRun }) => isRepresentativeRun);
  if (!config || representative.length === 0) {
    return { passed: false, markdown: '### Lighthouse (mobile)\n\nLighthouse wrote no results: see the run’s log.' };
  }
  const minimum = (id: string): number => config.ci.assert.assertions[`categories:${id}`]?.[1].minScore ?? 0;
  const cell = (run: LighthouseRun, id: string): string => {
    const score = Math.round((run.summary[id] ?? 0) * 100);
    const threshold = Math.round(minimum(id) * 100);
    return score < threshold ? `**${score}** (below ${threshold})` : `${score}`;
  };
  const rows = representative.map(
    (run) => `| \`${new URL(run.url).pathname}\` | ${categories.map(({ id }) => cell(run, id)).join(' | ')} |`
  );
  const passed = representative.every((run) => categories.every(({ id }) => (run.summary[id] ?? 0) >= minimum(id)));
  const table = [
    `| Page | ${categories.map(({ name }) => name).join(' | ')} |`,
    `| --- | ${categories.map(() => '---').join(' | ')} |`,
    ...rows
  ].join('\n');
  return { passed, markdown: `### Lighthouse (mobile)\n\nThe median of three runs per page.\n\n${table}` };
};

const runUrl = process.argv[2] ?? '';
const playwright = playwrightSection(readJson<PlaywrightResults>('test-results/results.json'));
const lighthouse = lighthouseSection(
  readJson<LighthouseRun[]>('lighthouse-report/manifest.json'),
  readJson<LighthouseConfig>('lighthouserc.json')
);
const verdict = playwright.passed && lighthouse.passed ? 'All checks passed.' : 'Some checks failed.';

console.log(
  [
    `## Preview checks\n\n${verdict} Reports are in the [run’s artefacts](${runUrl}).`,
    playwright.markdown,
    lighthouse.markdown
  ].join('\n\n')
);
