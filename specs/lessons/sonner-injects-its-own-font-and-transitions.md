# Sonner injects its own font and transitions, even unstyled

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review
- **Paths:** `frontend/src/dino/sonner.tsx`, `frontend/src/dino/sonner.stories.tsx`
- **Rule:** Sonner adds a stylesheet at load that `unstyled: true` doesn't remove: `[data-sonner-toaster]` sets its own `font-family` (a system font stack, not Nunito) and 400 ms transitions, and stacked toasts exit in 0.5 s. Override each with an important utility on the Toaster's `className` or the toast's class names (`font-sans!`, `duration-150!`), and assert the computed value in the story. Sonner also replays every toast still showing to a newly mounted Toaster, so a toast story file dismisses them in `beforeEach`, or one story's toast shows up in the next.
- **Why:** On TAS-79 the spec caught the transitions but not the font: the toast had always drawn its text in the runner's system font, and its old baseline showed it. The state stories also failed with "multiple elements" until each story dismissed the last one's toast.
- **Re-check by:** 2027-01-29
