# Biome rejects an ARIA listbox written on `ul` and `li`

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-77
- **Paths:** `frontend/src/**`
- **Rule:** `pnpm lint` fails on `<ul role="listbox">` and `<li role="option">` (`lint/a11y/noNoninteractiveElementToInteractiveRole`), on an option that isn't focusable (`lint/a11y/useFocusableInteractive`) and on an option with `onClick` but no key handler (`lint/a11y/useKeyWithClickEvents`). For a hand-built combobox, give options `tabIndex={-1}`, pick on `onMouseDown` (which also keeps focus in the input), and either use `div`s or keep `ul`/`li` with a `biome-ignore` on each. A spec that sketches listbox markup should say which.
- **Why:** The Picnic fields board draws the combobox's list as `ul`/`li`, and TAS-77's spec asked for that markup exactly; a probe file with the board's markup failed all three rules. cmdk had built the same roles at run time, so Biome never saw them.
- **Re-check by:** 2027-01-29
