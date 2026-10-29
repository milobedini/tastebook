# Story screenshots tolerate antialiasing, not real changes

- **Added:** 2026-10-29 · **Applies to:** implement | review · **Issue:** TAS-90
- **Paths:** `frontend/playwright.visual.config.ts`, `frontend/scripts/update-visual-baselines.ts`
- **Rule:** `toHaveScreenshot` has `maxDiffPixels: 4` so a few antialiased edge pixels that vary between runs don't fail the check or churn a baseline. Keep it under 8: a 2px change to `--radius-check` moves only 8 pixels on the checkbox. Playwright's default per-pixel `threshold` (0.2) already ignores small colour shifts, so a token nudged by a few levels passes; a change to another palette colour fails. `test:visual:update` rewrites only shots outside the tolerance (`--update-snapshots=changed`), so an unchanged branch commits nothing.
- **Why:** On PR #77 the old update rewrote every baseline, and the ServingsStepper Default shot changed bytes with no real change: 32 pixels on the pill's rounded border, each one colour level off.
- **Re-check by:** 2027-01-29
