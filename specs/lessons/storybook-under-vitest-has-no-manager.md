# Stories under the Vitest add-on have no Storybook UI behind them

- **Added:** 2026-10-29 · **Applies to:** spec | implement · **Issue:** TAS-72
- **Rule:** In `pnpm test`, stories render without the Storybook UI, so anything that waits on its channel does nothing. `storybook-addon-pseudo-states` doesn't force `:hover`, `:active` or `:focus-visible` (don't assert on a forced state's styles), and `useArgs` updates never re-render (keep a stateful story's value in React state seeded from its args).
- **Why:** On PR #67 the Button state guards and the first stateful control stories failed under Vitest while the built Storybook showed them correctly.
- **Re-check by:** 2027-01-29
