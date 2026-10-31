# A confirm dialog takes focus back after its action's request settles

- **Added:** 2026-10-31 · **Applies to:** spec | implement | review · **Issue:** TAS-109
- **Paths:** `frontend/src/**/*-page.tsx`, `frontend/src/dino/confirm-dialog.tsx`
- **Rule:** When a ConfirmDialog's action removes its own trigger (a row's Remove, a section's Leave), don't call `.focus()` when the mutation resolves: Radix hands focus back to the trigger as the dialog unmounts, and TanStack Query passes `setQueryData` to React a tick later, so the trigger is often still there and takes focus back, then goes, leaving focus on `body`. Move focus at the commit that drops the trigger instead: keep what was acted on in state and pass the target a ref callback (`ref={triggerGone ? takeFocus : undefined}`), as `household-page.tsx` does. A spec that says "focus moves to X" after such an action should say so.
- **Why:** On PR #109 the first build focused the Members heading after `mutateAsync`; the page tests found focus on `body` after both Remove and Leave.
- **Re-check by:** 2027-01-31
