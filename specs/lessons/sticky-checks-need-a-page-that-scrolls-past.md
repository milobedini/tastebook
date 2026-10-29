# A sticky or scroll check needs a page that scrolls past the element

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review | verify · **Issue:** TAS-137
- **Paths:** `frontend/e2e/**`
- **Rule:** Test and record sticky or scroll behaviour on a page that scrolls well past where the element would sit unstuck, such as a recipe whose method is much longer than its ingredients (`/recipes/baguette`). Run the test once with the sticky class removed and see it fail before trusting it.
- **Why:** On PR #97 the sticky-ingredients e2e test used oat-and-raisin cookies, which only scroll 342 px, and passed with `lg:sticky lg:top-6` removed. The laptop evidence used chicken tikka masala, whose ingredients are longer than its method, so the shot showed them in their normal place, not stuck.
