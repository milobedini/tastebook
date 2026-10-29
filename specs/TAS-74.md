---
issue: TAS-74
status: building # draft | approved | building | done
branch: tastebook/tas-74-screenshot-every-story-so-a-look-cant-change-unapproved
pr: 72
---

# Screenshot every story so a look can't change unapproved

Linear: TAS-74

## Summary

Nothing stops a Dino story's look from changing today: axe and the interaction tests pass whatever a component looks like. This work screenshots every story in the built Storybook with Playwright, commits the screenshots as baselines, and fails CI when a story no longer matches its baseline. A PR that changes a look on purpose commits the new baselines, so GitHub shows the old and new images in its diff and merging approves them. One map names each story's board image, so review can compare a changed baseline with its board.

Evidence: chore — nothing changes for people using Tastebook; this adds a check, a workflow and committed screenshots.
Design: skip — tooling only; no new component, variant or visual change. The Toast story keeps its toast on screen, which changes no component.

**Build after TAS-73 merges.** TAS-73 (PR #69) moves Dino to Picnic's tokens and fonts and renames `frontend/src/ui/` to `frontend/src/dino/`. The first baselines must show Picnic, not Enamel, so the implement stage starts from a `main` that has TAS-73. Every path below uses the names TAS-73 gives them.

## Required reading

- `AGENTS.md`: hard constraints, Tests, Commands, Layout and the Workflows rules (secrets in step `env` only).
- `specs/lessons/storybook-under-vitest-has-no-manager.md`: why the screenshots run with Playwright against `storybook-static`, not under the Vitest add-on (pseudo-states aren't forced there).
- `specs/lessons/vercel-detects-storybook-as-the-framework.md`: the Vercel build is untouched; listed under Blast radius.
- `frontend/playwright.config.ts`: mirror its shape (`defineConfig`, `isCi`, `forbidOnly`, `reducedMotion: 'reduce'`, `webServer`) for the new config.
- `frontend/.storybook/preview.tsx`: the fonts it imports and its `afterEach` target check, which run in every screenshot.
- `frontend/src/dino/story-states.ts`: the pseudo-state parameters the `*IsHover`, `*IsPressed` and `*IsFocus` stories use.
- `frontend/src/dino/sonner.stories.tsx`: the one story this work edits.
- `.github/workflows/ci.yml`: the Frontend job the check joins.
- `docs/design.md`, Components (its first paragraph): where the map and baselines are described for people.
- The **Spec brief** comment on TAS-74: what was checked on a local `storybook-static` (index shape, the ready signal, pseudo-states in `iframe.html`).

## Product behaviour

1. Every story is screenshotted at 390 × 844 px, with animations off and fonts loaded.
2. A story whose look differs from its committed baseline fails CI's Frontend job.
3. A PR that commits updated baselines with a look change passes CI.
4. Baselines are made only on a GitHub Actions Linux runner; the update command refuses elsewhere.
5. The Update screenshots workflow commits fresh baselines to a person's branch and starts CI.
6. The Update screenshots workflow refuses to run on `main`.
7. A baseline whose story was deleted or renamed fails CI.
8. Every story title names an existing board image in one map, and every map entry has a story.

## Technical design

- **Approach:**
  - Today CI builds Storybook (`.github/workflows/ci.yml:35`) and runs every story under the Vitest add-on (`frontend/vitest.config.ts`), where `storybook-addon-pseudo-states` doesn't force states. The built `storybook-static/index.json` (v5) lists 95 entries, all `type: "story"`, across 20 `Dino/*` titles. Each story renders alone at `iframe.html?id=<id>&viewMode=story`, where pseudo-states are forced (checked in the Spec brief).
  - A second Playwright config, `frontend/playwright.visual.config.ts`, serves `storybook-static` with `vite preview` and runs `frontend/visual/stories.spec.ts`. The spec reads `index.json` when Playwright collects tests and declares one test per story, plus two whole-set checks: no orphan baselines, and every title has a board.
  - Baselines live in `frontend/visual/baselines/<story-id>.png`, one per story, no platform suffix.
  - `frontend/scripts/update-visual-baselines.ts` builds Storybook, deletes the baselines folder and regenerates every baseline. It refuses unless it runs on a GitHub Actions Linux runner. The factory's implement runner and the new workflow both qualify; a laptop doesn't.
  - `.github/workflows/update-screenshots.yml` (`workflow_dispatch`) runs the update script on the chosen branch, commits any change and starts CI on the new commit with `gh workflow run`. CI gains a `workflow_dispatch` trigger for this. A push made with `GITHUB_TOKEN` starts no workflow, but a `workflow_dispatch` made with it does.
  - `frontend/src/dino/boards.ts` maps each story title to its board PNG. The visual spec checks the map against `index.json` and the files on disk, and annotates each story's test with its board, so the HTML report shows which board to compare a failed shot with.
- **API contract:** No change.
- **Blast radius:** see [Blast radius](#blast-radius).
- **Not changing:** see [Out of scope](#out-of-scope).

```mermaid
flowchart LR
  PR[Push to a PR] --> CI[CI Frontend job]
  CI --> Build[build-storybook]
  Build --> Visual[test:visual]
  Visual -->|all match| Pass[Check passes]
  Visual -->|a shot differs, an orphan baseline, a title without a board| Fail[Check fails, report uploaded]
  Fail --> Who{Who updates}
  Who -->|factory implement run| Script[test:visual:update on its runner, commit, push]
  Who -->|a person| WF[Update screenshots workflow on the branch]
  WF --> Commit[Commit baselines with GITHUB_TOKEN]
  Commit --> Dispatch[gh workflow run ci.yml on the branch]
  Script --> CI
  Dispatch --> CI
```

### Steps

0. **Start from Picnic.** Merge `main` into the branch once TAS-73 (PR #69) has merged. If it hasn't, stop and report `blocked`: "Waiting for TAS-73 (Picnic tokens) to merge; a reply in the thread starts me again."
   Done when: `frontend/src/dino/picnic.css` exists on the branch and `frontend/src/ui/` doesn't.

1. **Keep the toast on screen.** `frontend/src/dino/sonner.stories.tsx` (edit)
   In `showToast`, add `duration: Number.POSITIVE_INFINITY` to the toast's options. Sonner otherwise dismisses it after 4 s, so the shot would race the timer.
   Done when: `pnpm test` passes, and in Storybook `Dino/Toast/Default` still shows the toast after 5 s.

2. **Map stories to boards.** `frontend/src/dino/boards.ts` (new). Don't export it from `frontend/src/dino/index.ts`; the app doesn't use it.

   ```ts
   // Each story title's board, as a path from the repo root. The visual spec checks this against the built index.
   export const boardByTitle: Record<string, `docs/design/${string}.dc.png`> = {
     'Dino/Button': 'docs/design/dino/buttons.dc.png',
     'Dino/IconButton': 'docs/design/dino/controls.dc.png',
     'Dino/FilterChip': 'docs/design/dino/controls.dc.png',
     'Dino/RemovableChip': 'docs/design/dino/controls.dc.png',
     'Dino/SegmentedControl': 'docs/design/dino/controls.dc.png',
     'Dino/ServingsStepper': 'docs/design/dino/controls.dc.png',
     'Dino/Banner': 'docs/design/dino/feedback.dc.png',
     'Dino/Toast': 'docs/design/dino/feedback.dc.png',
     'Dino/ConfirmDialog': 'docs/design/dino/feedback.dc.png',
     'Dino/EmptyState': 'docs/design/dino/feedback.dc.png',
     'Dino/Field': 'docs/design/dino/fields.dc.png',
     'Dino/Input': 'docs/design/dino/fields.dc.png',
     'Dino/NativeSelect': 'docs/design/dino/fields.dc.png',
     'Dino/SearchInput': 'docs/design/dino/fields.dc.png',
     'Dino/CheckboxRow': 'docs/design/dino/fields.dc.png',
     'Dino/RecipeCard': 'docs/design/dino/polaroids.dc.png',
     'Dino/RecipePhoto': 'docs/design/dino/polaroids.dc.png',
     'Dino/CuisinePlate': 'docs/design/dino/polaroids.dc.png',
     'Dino/Tag': 'docs/design/dino/polaroids.dc.png',
     'Dino/Page': 'docs/design/dino/layout.dc.png'
   };
   ```

   Done when: `pnpm lint` passes.

3. **Add the visual config.** `frontend/playwright.visual.config.ts` (new), `frontend/tsconfig.node.json` (edit: add `playwright.visual.config.ts` and `visual` to `include`)

   ```ts
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
       { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } }
     ],
     webServer: {
       command: 'pnpm exec vite preview --outDir storybook-static --port 6007 --strictPort',
       url: 'http://localhost:6007/index.json',
       reuseExistingServer: !isCi
     }
   });
   ```

   `toHaveScreenshot` keeps its default tolerance (`threshold: 0.2` per pixel, `maxDiffPixels: 0`): any visible change fails.
   Done when: `pnpm lint` passes.

4. **Write the visual spec.** `frontend/visual/stories.spec.ts` (new)
   - At module level, read `../storybook-static/index.json` (resolved from `import.meta.dirname`). If it's missing, throw `Error('Build Storybook first: pnpm --filter frontend build-storybook')`. Type it as `{ v: number; entries: Record<string, { id: string; title: string; name: string; type: 'story' | 'docs' }> }` and keep the entries whose `type` is `'story'`.
   - Declare the global the ready check reads: `interface Window { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }`.
   - For each story, `test(\`${title} › ${name}\`, …)`:
     1. Push the annotation `{ type: 'board', description: boardByTitle[title] }` when the map has one.
     2. `page.goto(\`/iframe.html?id=${id}&viewMode=story\`)`.
     3. `page.waitForFunction(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished')`. The phase ends at `finished` after `play` and the preview's `afterEach`; a story that errors never reaches it and the test times out.
     4. `page.evaluate(() => document.fonts.ready)`.
     5. `expect(page).toHaveScreenshot(\`${id}.png\`, { fullPage: true })`. The whole page, not the story root, so portalled dialogs and toasts are in the shot.
   - `test('every baseline has a story', …)`: list the `.png` files in `visual/baselines/` (none when the folder doesn't exist yet), strip `.png`, keep the names that aren't a story id, and `expect(orphans).toEqual([])`.
   - `test('every story title has a board image', …)`: with `titles` the distinct story titles, expect `[...titles].filter((title) => !boardByTitle[title] || !existsSync(<repo root>/<path>))` to equal `[]`, and `Object.keys(boardByTitle).filter((title) => !titles.has(title))` to equal `[]`.
   Done when: after `pnpm --filter frontend build-storybook`, `pnpm --filter frontend test:visual` runs 97 tests (95 stories and the two checks) and fails only for missing baselines.

5. **Add the scripts.** `frontend/scripts/update-visual-baselines.ts` (new), `frontend/package.json` (edit)
   - `package.json` scripts: `"test:visual": "playwright test -c playwright.visual.config.ts"` and `"test:visual:update": "node scripts/update-visual-baselines.ts"` (Node 24 runs the type-stripped file).
   - The script: if `process.platform !== 'linux'` or `process.env.GITHUB_ACTIONS !== 'true'`, print `Baselines are made on CI's Linux image only, so they match the check. Run the Update screenshots workflow on your branch.` and exit 1. Otherwise run, in order, with `execFileSync` and `stdio: 'inherit'` from the `frontend/` folder: `pnpm build-storybook`; delete `visual/baselines` (`rmSync`, `recursive`, `force`), so a deleted or renamed story leaves no orphan; `pnpm exec playwright test -c playwright.visual.config.ts --update-snapshots=all`.
   Done when: on the implement runner, `pnpm --filter frontend test:visual:update` writes 95 PNGs to `frontend/visual/baselines/`, then `pnpm --filter frontend test:visual` passes 97 tests; and the script exits 1 with the message when run with `GITHUB_ACTIONS` unset.

6. **Commit the first baselines.** `frontend/visual/baselines/*.png` (new, 95 files), made by step 5's command on the implement runner. Open three of them (a button, a dialog, the toast) and check they show Picnic's colours and fonts, the forced state and the whole dialog or toast.
   Done when: the three look right and `test:visual` passes.

7. **Gate CI.** `.github/workflows/ci.yml` (edit)
   - Add `workflow_dispatch:` under `on:`.
   - In the Frontend job, after `pnpm --filter frontend build-storybook`, add `- run: pnpm --filter frontend test:visual`, then an `actions/upload-artifact` step pinned to the same SHA the e2e job uses, `if: failure()`, named `visual-report`, with paths `frontend/playwright-report/visual` and `frontend/test-results/visual`, `retention-days: 14`.
   Done when: CI on the PR runs `test:visual` green.

8. **Add the update workflow.** `.github/workflows/update-screenshots.yml` (new)

   Two jobs, so the write token never shares a job with repo or dependency code (review round 1): `render` holds a read-only token and uploads the baselines; `commit` holds the write token and runs only git and gh.

   ```yaml
   name: Update screenshots

   on:
     workflow_dispatch:

   permissions:
     contents: read

   concurrency:
     group: update-screenshots-${{ github.ref }}
     cancel-in-progress: true

   jobs:
     # Runs the branch's code and its dependencies, so it holds a read-only token.
     render:
       name: Render screenshots
       runs-on: ubuntu-latest
       steps:
         - name: Refuse main and tags
           if: github.ref_type != 'branch' || github.ref_name == 'main'
           run: |
             echo "::error::Run this on your PR's branch, never on main."
             exit 1
         - uses: actions/checkout@<same SHA as ci.yml> # v7.0.1
           with:
             persist-credentials: false
         - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0
         - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
           with:
             node-version: 24
             cache: pnpm
         - run: pnpm install --frozen-lockfile
         - run: pnpm --filter frontend exec playwright install --with-deps chromium
         - run: pnpm --filter frontend test:visual:update
         - uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
           with:
             name: baselines
             path: frontend/visual/baselines
             if-no-files-found: error
             retention-days: 1

     # Holds the write token, so it runs only git and gh: no repo or dependency code.
     commit:
       name: Commit screenshots
       needs: render
       runs-on: ubuntu-latest
       permissions:
         contents: write
         actions: write
       steps:
         - uses: actions/checkout@<same SHA as ci.yml> # v7.0.1
           with:
             # The token stays out of .git/config; the push below passes it explicitly.
             persist-credentials: false
         - uses: actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333 # v8.0.2
           with:
             name: baselines
             path: ${{ runner.temp }}/baselines
         - name: Replace the baselines
           run: |
             # Starting empty drops the baseline of a deleted or renamed story.
             rm -rf frontend/visual/baselines
             mv "$RUNNER_TEMP/baselines" frontend/visual/baselines
         - name: Commit the baselines
           id: commit
           env:
             GH_TOKEN: ${{ github.token }}
           run: |
             git add -A frontend/visual/baselines
             if git diff --cached --quiet; then
               echo "No story's look changed."
               exit 0
             fi
             git -c user.name="github-actions[bot]" \
               -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
               commit -m "Update story screenshots"
             git push "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" "HEAD:${GITHUB_REF_NAME}"
             echo "changed=true" >> "$GITHUB_OUTPUT"
         # A push with GITHUB_TOKEN starts no workflow, but a dispatch made with it does.
         - name: Run CI on the new commit
           if: steps.commit.outputs.changed == 'true'
           env:
             GH_TOKEN: ${{ github.token }}
           run: gh workflow run ci.yml --repo "$GITHUB_REPOSITORY" --ref "$GITHUB_REF_NAME"
   ```

   Done when: the workflow passes `actionlint` (run with `pnpm dlx` or the release binary on the runner), and a dispatch on `main` fails at "Refuse main and tags" (checked after merge; see Assumptions).

9. **Document it.** `AGENTS.md` (edit), `docs/design.md` (edit)
   - `AGENTS.md`, Commands table, after the Storybook row: `| Story screenshots | pnpm --filter frontend test:visual (after build-storybook); new baselines: pnpm --filter frontend test:visual:update on a GitHub Actions runner, or the **Update screenshots** workflow on your branch |`.
   - `AGENTS.md`, Tests: `- [a] when a change alters a story's look on purpose, commit its updated baselines (frontend/visual/baselines/) in the same PR, so the diff shows the old and new images.` and `- [n] make baselines anywhere but a GitHub Actions Linux runner: fonts and anti-aliasing differ, and every shot would fail.`
   - `AGENTS.md`, Layout, under `e2e/`: `  visual/           Playwright screenshot of every story (one baseline each in visual/baselines/), run against storybook-static`.
   - `docs/design.md`, Components (its first paragraph), after "every story passes axe and its interaction tests in CI.": `Every story also has a screenshot baseline in frontend/visual/baselines/ that CI compares it with, and frontend/src/dino/boards.ts names each story's board image, so review can compare a changed baseline with its board.`
   Done when: `pnpm lint` passes.

### Tests

The visual spec is itself the check; its cases are in Step 4. Prove each gate fails for a defect on the implement runner, then revert, and record each result in the PR:

- `frontend/visual/stories.spec.ts`, story cases
  - Change one Picnic token's value in `frontend/src/dino/picnic.css` locally, rebuild Storybook, run `test:visual`, asserts: the stories that use the token fail with `Screenshot comparison failed`, and the others pass.
- `frontend/visual/stories.spec.ts`, `every baseline has a story`
  - Copy `dino-button--primary.png` to `dino-button--gone.png` in `visual/baselines/`, asserts: the test fails listing `dino-button--gone`.
- `frontend/visual/stories.spec.ts`, `every story title has a board image`
  - Remove the `'Dino/Page'` entry from `boardByTitle`, asserts: the test fails listing `Dino/Page`.
  - Add `'Dino/Gone': 'docs/design/dino/buttons.dc.png'`, asserts: the test fails listing `Dino/Gone`.
- `frontend/scripts/update-visual-baselines.ts`
  - `env -u GITHUB_ACTIONS pnpm --filter frontend test:visual:update`, asserts: exit code 1 and the message, and `visual/baselines/` unchanged.
- Flake check: run `pnpm --filter frontend test:visual --repeat-each=3` once, asserts: 291 story shots pass with no retries.

## Decisions

- One Playwright test per story against `storybook-static`'s `iframe.html`, not the Vitest add-on, because the add-on doesn't force pseudo-states (`specs/lessons/storybook-under-vitest-has-no-manager.md`), and the iframe does.
- After the update workflow commits baselines, it starts CI itself with `gh workflow run ci.yml`, because a `GITHUB_TOKEN` push starts no workflow and this needs no new secret; CI gains a `workflow_dispatch` trigger. Asked: how should CI run on the workflow's commit? → Workflow starts CI.
- Stories are shot at 390 × 844 px, the whole page, and the work waits for TAS-73 so the first baselines are Picnic's. Asked: which fixed viewport? → Phone, 390 px wide; build after TAS-73 merges.
- `deviceScaleFactor: 1`, because about 95 committed PNGs stay small and their GitHub diffs stay readable; a 390 px shot at 1× shows every state a board draws.
- Default `toHaveScreenshot` tolerance and no retries, because the issue wants any look change to fail and a flaky shot fixed, not retried.
- The update script regenerates every baseline after deleting the folder, because that removes a deleted or renamed story's orphan in the same command, and unchanged stories render the same pixels on the same image.
- The update script refuses unless `GITHUB_ACTIONS` is `true` on Linux, because baselines from any other machine would fail every check.
- The board map is one `Record` keyed by story title in `frontend/src/dino/boards.ts`, checked against `index.json` both ways, because a per-story `parameters.board` would be a second, hand-synced list. It lives in `src/dino/` so a change to it gets the `dino` label and the design-system review.
- `vite preview` serves `storybook-static`, because Vite is already a dependency and nothing new is installed.
- The workflow checks out without persisted credentials and passes `GITHUB_TOKEN` only to the steps that push and dispatch, per `AGENTS.md`'s Workflows rule.
- Runners stay `ubuntu-latest`, because the factory's stage runner is `ubuntu-latest` too, and baselines must match wherever they're made.

## Blast radius

- `.github/workflows/ci.yml`: the Frontend job gains a step, and the workflow a `workflow_dispatch` trigger. A dispatched run's concurrency group is `ci-refs/heads/<branch>`, apart from the PR's `ci-refs/pull/<n>/merge`, so neither cancels the other. Re-check that the PR shows the dispatched run's Frontend, Backend, API contract and End-to-end checks.
- `frontend/src/dino/sonner.stories.tsx`: only the story's toast duration; the Vitest storybook project runs it too. Re-check `pnpm test`.
- `frontend/tsconfig.node.json`: two more includes. Re-check `pnpm lint`.
- `vercel.json` and the preview build: unchanged. Neither runs `test:visual`, and `frontend/visual/` isn't imported by the app.
- `frontend/playwright.config.ts`, `pnpm test:e2e` and the preview checks: unchanged; their `testDir` is `./e2e`.

## Assumptions

- The board map in Step 2 is right: Page → layout, RecipeCard, RecipePhoto, CuisinePlate and Tag → polaroids, Toast → feedback. Tag maps to polaroids until a Sticker replaces it (`docs/design.md`, line 155). This wasn't asked. Confirm with: Milo, at spec approval.
- Branch protection accepts checks from a `workflow_dispatch` CI run on the PR's head commit, since GitHub matches required checks by name. Confirm with: Milo, on the first run of the Update screenshots workflow after merge.
- The factory's implement runner is a GitHub Actions `ubuntu-latest` runner with the same Playwright Chromium as CI (Spec brief), so its baselines match CI's. Confirm with: the implement stage, when `test:visual` passes in CI on the first baselines.
- The workflow's commit (`Update story screenshots`) has no issue ID in its body, because the workflow doesn't know the issue; the PR links it. Confirm with: Milo, at spec approval.

## Out of scope

- Screenshots of app pages; Playwright's e2e specs keep covering pages.
- Any pixel comparison against board images; review compares them by eye (design-system rubric).
- Rendering boards in CI; board PNGs are committed beside each board (`docs/design.md`, line 5).
- Running the update workflow for a fork's branch; it runs on branches in this repo.
- Laptop or tablet viewports.
- Restyling any component; TAS-75 to TAS-81 do that, each updating its baselines.

## Validation criteria

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm --filter frontend build-storybook && pnpm --filter frontend test:visual` (97 passed)
- [ ] Each failure check in Tests, with its result in the PR
- [ ] CI's Frontend job runs `test:visual` green on the PR
- [ ] After merge: dispatch Update screenshots on a branch with a look change, then on `main` (refused)
- Evidence: chore: "No visible change."
