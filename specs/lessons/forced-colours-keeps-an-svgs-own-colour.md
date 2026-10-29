# Forced colours keeps an SVG's own colour, and axe misreads text there

- **Added:** 2026-10-29 · **Applies to:** spec | implement | review · **Issue:** TAS-83
- **Paths:** `frontend/src/dino/**`, `frontend/e2e/**`
- **Rule:** Chromium gives SVG elements `forced-color-adjust: preserve-parent-color`, so an `<svg>` with its own colour class (`text-pop`) keeps that colour under forced colours, and a `currentColor` stroke stays the brand colour. Set the colour on an HTML wrapper the SVG inherits from (as the empty state's Doodle does), or add `forced-colors:text-current` to the SVG. And under `page.emulateMedia({ forcedColors: 'active' })`, Chromium reports the unforced `-webkit-text-fill-color` that axe's `color-contrast` reads, so it fails text painted in `CanvasText` on `Canvas`; `e2e/fixtures.ts` turns that one rule off when forced colours are on.
- **Why:** The TAS-83 spec drew the squiggle as `currentColor` on `text-pop` "so forced colours redraws it". The first forced-colours e2e run showed the stroke still peach, and axe failed every line of text on home and not found though the screenshot showed black on white.
- **Re-check by:** 2027-01-29
