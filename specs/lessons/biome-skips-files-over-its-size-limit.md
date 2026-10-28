# Biome skips files over its size limit

- **Added:** 2026-10-28 · **Applies to:** implement | review · **Issue:** TAS-52
- **Paths:** `biome.json`, `backend/recipes/catalogue.json`
- **Rule:** Biome only warns about a file bigger than `files.maxSize` and leaves it unformatted and unchecked, so `pnpm format` and `pnpm lint` still pass. `biome.json` sets the limit to 2 MiB. `catalogue.json` is about 1.1 MiB after five batches. When a batch takes it near 2 MiB, raise the limit in the same PR. Check that `pnpm exec biome format backend/recipes/catalogue.json` prints no size warning.
- **Why:** Batch 5 (TAS-52) took `catalogue.json` past Biome's 1 MiB default. `pnpm format` then reported "No fixes applied" with a size warning, and the file's layout went unchecked.
- **Re-check by:** 2027-01-28
