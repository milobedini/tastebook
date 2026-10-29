# A pressed style loses to an aria-* or data-* state fill

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-101
- **Paths:** `frontend/src/dino/*.tsx`
- **Rule:** Tailwind v4 sorts `aria-*` and `data-*` variants after `active`, so at equal specificity `data-highlighted:bg-line` or `aria-expanded:bg-line` beats `active:bg-surface-pressed`. When an element can be pressed while it carries such a state, stack the variants for the pressed fill (`data-highlighted:active:bg-surface-pressed`, `aria-expanded:active:*:bg-surface-pressed`), as `icon-button.tsx` already does with `aria-pressed:active`.
- **Why:** On PR #98 a menu item never showed Surface pressed, since Radix highlights the item under the pointer, and the avatar button lost its pressed fill to its expanded fill, since Radix opens the menu on pointerdown.
- **Re-check by:** 2027-01-29
