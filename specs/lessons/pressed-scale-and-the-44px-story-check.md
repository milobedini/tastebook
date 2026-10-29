# A pressed control's scale shrinks what the story check measures

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-76
- **Paths:** `frontend/.storybook/preview.tsx`, `frontend/src/dino/*.stories.tsx`
- **Rule:** The preview's `afterEach` 44 px check measures each control's layout height (`offsetHeight`), so a pressed state drawn with `scale` (97%, 96%, 92%) doesn't count as a short target. Keep it that way: a bounding box includes transforms. And a radio laid over a segment with `absolute inset-0` covers only the padding box; cover the border too (`-inset-0.5` for a 2 px border) or it measures 40 px.
- **Why:** On PR #80 every Is Pressed story passed under Vitest, where the 120 ms transition hadn't run yet, then rendered the check's error in the static build the screenshots are taken from, where the scale had finished. The spec's `inset-0` radio failed the check outright.
- **Re-check by:** 2027-01-29
