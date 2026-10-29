# A factory run can't dispatch Update screenshots, but can make baselines itself

- **Added:** 2026-10-29 · **Applies to:** spec | implement · **Issue:** TAS-77
- **Rule:** The factory's GitHub token is refused when it dispatches a workflow (`gh workflow run update-screenshots.yml` returns HTTP 403), so a spec step that says "run the Update screenshots workflow" can't be followed by the implement stage. The stage runs on a GitHub-hosted Ubuntu runner, the same image as CI: build Storybook, run the whole visual suite first to confirm every unchanged story matches its baseline, then regenerate only the changed ones with `pnpm --filter frontend exec playwright test -c playwright.visual.config.ts -g "<titles>" --update-snapshots=changed`, and look at each against its board before committing.
- **Why:** On PR #81 the dispatch failed with 403; on the run's own runner all 85 unchanged stories matched their baselines, so the 15 field baselines were made there.
- **Re-check by:** 2027-01-29
