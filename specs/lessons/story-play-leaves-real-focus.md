# A story's play function leaves real focus in its screenshot

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-74
- **Paths:** `frontend/visual/**`, `frontend/src/dino/*.stories.tsx`
- **Rule:** `userEvent` clicks in a play function leave the control focused with a real `:focus-visible` ring, so a shot taken straight after play shows focus, not the resting look. `frontend/visual/stories.spec.ts` blurs the active element before every shot; keep it, and show focus in an Is Focus story that forces it with a class.
- **Why:** On PR #72 the first FilterChip Default baseline was byte-identical to Is Focus, and the SegmentedControl, CheckboxRow, Toast and ConfirmDialog shots all carried a ring play had left.
- **Re-check by:** 2027-01-29
