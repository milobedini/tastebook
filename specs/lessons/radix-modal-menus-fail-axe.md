# A modal Radix menu fails axe's aria-hidden-focus

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-101
- **Paths:** `frontend/src/dino/**`
- **Rule:** Radix `DropdownMenu` is modal by default: while open it sets `aria-hidden` on everything else in the body, its own trigger included, and axe fails the page with `aria-hidden-focus`, since that trigger stays focusable. A dialog escapes the rule because axe excuses content hidden behind an `aria-modal` dialog; a menu isn't one. Use `modal={false}` for a menu (Escape, Tab and a click outside still close it), and say so in the spec.
- **Why:** The TAS-101 spec asked for a modal menu. Every story that ended with the menu open failed axe in `pnpm test`, while the Sheet's open story, a Radix dialog, passed.
- **Re-check by:** 2027-01-29
