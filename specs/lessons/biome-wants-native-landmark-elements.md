# Biome rejects an ARIA role that has a native element

- **Added:** 2026-10-25 · **Applies to:** spec | implement | review · **Issue:** TAS-15
- **Rule:** `pnpm lint` runs Biome's `lint/a11y/useSemanticElements`, which fails on an explicit `role` that a native element provides: write `<search>`, not `<form role="search">`, and the same for `<nav>`, `<main>` or `<header>`. A spec that sketches markup should use the native element.
- **Why:** The TAS-15 spec sketched the search box as `<form role="search">`, and the first `pnpm lint` failed. The build used `<search>` with no form, which keeps the landmark and leaves Enter with nothing to submit.
- **Re-check by:** 2027-01-25
