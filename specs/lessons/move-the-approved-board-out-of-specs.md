# Move an approved board into docs/design before building

- **Added:** 2026-10-29 · **Applies to:** implement | review · **Issue:** TAS-113
- **Paths:** `specs/*/design/**`, `docs/design/**`, `biome.json`
- **Rule:** The design stage commits its boards to `specs/<ISSUE-ID>/design/`, where `biome check` lints them as HTML (it ignores only `docs/design/**/*.html`), so `pnpm lint` fails on board markup: an `aria-checked` set from a template, decorative SVGs with no title. Move the board a story points at into `docs/design/` with `git mv` (HTML and PNG, renamed to `<name>.dc.html` and `<name>.dc.png`) in the first commit, and run `pnpm lint` before building anything else.
- **Why:** On PR #93 (TAS-113) the approved `Main.dc.html` under `specs/TAS-113/design/` gave nine Biome errors, so the PR's lint would have failed with no code changed.
- **Re-check by:** 2027-01-29
