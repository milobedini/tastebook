# Design system: Enamel

Tastebook's look, agreed in the design system session on 2026-10-26. Cheerful and sturdy, like an enamel pie dish: a blue-white ground, cobalt for anything you act on, round shapes, and a typeface built for legibility.

The app's `/styleguide` page (local and previews only, never production) is the reference: it shows every token and component in light and dark. [`design/enamel.html`](design/enamel.html) is the design session's original. This file stays the rules. This is a starting point: change it through PRs like the code.

## Colour

Token names follow Tailwind's `--color-*` convention, so `--color-cobalt` is `bg-cobalt`, `text-cobalt` and so on. Contrast is against Surface unless noted; every text pair reaches 4.5:1 ([WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)) and field borders reach 3:1 ([1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast)) in both themes.

| Token | Light | Dark | Use | Contrast (light / dark) |
| --- | --- | --- | --- | --- |
| `--color-ground` | `#f3f5f8` | `#0d1424` | Page background | |
| `--color-surface` | `#ffffff` | `#16203a` | Cards, panels, fields | |
| `--color-ink` | `#14213a` | `#e8edf7` | Text | 16.1 / 13.7 |
| `--color-muted` | `#55617a` | `#9aa6bf` | Secondary text | 6.2 / 6.6 |
| `--color-cobalt` | `#1f4fd1` | `#8aa9ff` | Actions, links, selected state, the recipe card rim | 6.8 / 7.1 |
| `--color-on-cobalt` | `#ffffff` | `#0d1424` | Text on cobalt | 6.8 / 8.1 |
| `--color-chip` | `#e6ecf7` | `#1e2b4a` | Quiet fills (stepper buttons, timer) | |
| `--color-line` | `#d5dce8` | `#2a3654` | Hairlines between rows and around panels (decorative) | |
| `--color-field` | `#7d8aa3` | `#66769a` | Borders of fields, chips and checkboxes | 3.5 / 3.6 |
| `--color-yolk` | `#ffd84d` | `#ffd84d` | Tags describing a recipe; things to check | |
| `--color-on-yolk` | `#14213a` | `#14213a` | Text on yolk | 11.6 / 11.6 |
| `--color-success` | `#1e7a46` | `#5fd18f` | Status: done, saved | 5.4 / 8.5 |
| `--color-warning` | `#7a5200` | `#ffd84d` | Status: needs a look | 6.9 / 11.7 |
| `--color-danger` | `#c2321f` | `#ff8a75` | Status: errors, destructive actions | 5.6 / 7.0 |
| `--color-on-danger` | `#ffffff` | `#0d1424` | Text on danger | |
| `--color-scrim` | `rgb(13 20 36 / 0.45)` | `rgb(0 0 0 / 0.6)` | The backdrop behind a dialog | |

**Cuisine colours** fill the placeholder plate when a recipe has no photo. They're decorative, so they have no contrast requirement: `--cuisine-italian` `#e2583e`, `--cuisine-indian` `#e0a526`, `--cuisine-japanese` `#4e7a5a`, `--cuisine-mexican` `#b8342c`, `--cuisine-french` `#7c8f4e`, `--cuisine-other` `#6a5acd`. A cuisine without its own colour uses `--cuisine-other`; add a cuisine's colour when it's added to the catalogue. The plate drawn on them is `--plate`: `#ffffff` in light, `#e8edf7` in dark.

Light and dark follow the phone's setting; a toggle overrides it by setting `data-theme="light"` or `data-theme="dark"` on the root element.

## Type

| Role | Face | Size / line height | Weight |
| --- | --- | --- | --- |
| Display XL | Bricolage Grotesque | 40 / 42 px | 800 |
| Display L | Bricolage Grotesque | 32 / 35 px | 800 |
| Display M | Bricolage Grotesque | 24 / 29 px | 700 |
| Title (recipe cards, panel headings) | Bricolage Grotesque | 18 / 23 px | 700 |
| Step (cooking mode) | Atkinson Hyperlegible | 24 / 32 px | 700 |
| Body | Atkinson Hyperlegible | 16 / 25 px | 400 |
| Small | Atkinson Hyperlegible | 14 / 21 px | 400 |
| Label | Atkinson Hyperlegible | 13 / 17 px | 700 |

Both faces are under the SIL Open Font License and are **bundled with the app**: never loaded from Google Fonts, which would send every visitor's IP address to Google (see UK GDPR in `AGENTS.md`, Standards) and fail offline. Numbers that line up (amounts, times) use tabular figures.

## Space and shape

- **Spacing:** a 4 px base: 4, 8, 12, 16, 24, 32, 48. Space siblings with `gap`, not margins.
- **Corners:** pill (999 px) for controls (buttons, chips, fields used for search, steppers), 18 px for cards and dialogs, 14 px for photos, 12 px for fields and banners, 8 px for checkboxes (the field corner would make a 24 px box a circle).
- **Edges:** the **cobalt rim** (3 px, `--color-cobalt`) is the recipe card's alone. Everything else uses a **hairline** (1 px, `--color-line`). Fields, chips and checkboxes use `--color-field` so they're visible as controls.
- **Photos:** 4:3 on cards, 16:10 at the top of a recipe. No photo: the placeholder plate in the recipe's first cuisine's colour, never a grey box.
- **Motion:** 150 ms ease-out fades and slides for sheets, dialogs and toasts; never over 200 ms. Nothing moves on its own except a running timer. `prefers-reduced-motion` turns it all off.

## Components

The set lives in `frontend/src/ui/` (shadcn/ui, restyled to Enamel) and is exported from its `index.ts`; the tokens are in `frontend/src/ui/enamel.css`. Build pages from these; add a component to `src/ui/` on its third use (`AGENTS.md`, rule of three). To add one from shadcn/ui, run `pnpm --filter frontend ui:add <name>`, restyle the new file to Enamel's tokens, export it from `index.ts` and show it on `/styleguide`.

| Component | Notes |
| --- | --- |
| Button | Primary (cobalt fill), secondary (cobalt outline), ghost, danger (danger fill), disabled (chip fill, muted text). One primary per screen. 44 px tall; 52 px (`lg`) in cooking mode. |
| Icon button | 44 × 44 px, field border; pressed state fills with cobalt. Always has an accessible name (`aria-label`), and a toggle keeps one name ("Favourite") while `aria-pressed` says whether it's on, so its name never changes under a screen reader. |
| Field | Visible label above, help text below, error replaces help in danger with an icon and says how to fix it ("Enter a number, like 4."). Search fields are pill-shaped with a search icon. |
| Filter chip | A toggle (`aria-pressed`), pill, field border; on is cobalt fill. A removable chip names what it removes in its label; it's cobalt-filled for a filter, or outlined in cobalt for a choice that changes how other filters combine (With all of these). |
| Tag | Yolk, not interactive: describes a recipe (Vegetarian, One-pot, Easy) or marks something to check. |
| Stepper | Servings: minus, "Serves 4", plus, or a yield: "Makes 16 cookies"; the count is announced (`aria-live="polite"`). |
| Segmented control | Two to four options, one pressed (Metric / US; System / Light / Dark). |
| Checkbox row | Shopping list rows: 48 px tall, a 24 px box, ticked rows struck through in muted. |
| Recipe card | Surface with the cobalt rim, photo or plate, title in Title type, meta (time, difficulty, cuisine) in Small muted. |
| Toast | Ink background, ground text, short message and at most one action ("Saved to Favourites · Undo"). |
| Banner | 2 px border in a status colour with its icon: warning for an import's gaps, success for a clean import. |
| Dialog | For anything that can't be undone: says exactly what happens; the danger button names the action ("Delete account"), the other is "Cancel". |
| Empty state | An icon, what's empty and why, and the way out ("Clear filters"). |

Cooking mode (Cooking mode project) uses Step type, `lg` buttons (52 px) and a large timer, and keeps the screen awake.

## Rules

Review checks new UI against these.

**Colour**

- Cobalt fill only on things you act on. One primary button per screen.
- Yolk only for tags that describe a recipe and for things to check.
- Success, warning and danger only for status, never decoration.
- Tokens only, never a literal colour, so both themes work.

**Shape**

- The cobalt rim belongs to recipe cards alone.
- Pills for controls, 18 px for cards, 14 px for photos, 12 px for fields, 8 px for checkboxes.
- No photo means the cuisine plate.

**Type and icons**

- Bricolage Grotesque for headings and the wordmark only; Atkinson Hyperlegible for everything else.
- Fonts bundled with the app, never loaded from Google.
- [Lucide](https://lucide.dev) icons at a 2 px stroke. An icon on its own always has a label for screen readers.

**State**

- A list's active option (the one Enter picks while focus stays in a search field) carries the cobalt outline, as focus does, beside its chip fill: the fill alone is too faint to see.

**Touch and motion**

- Every control at least 44 px tall (WCAG 2.5.8 asks for 24); 48 px or more in cooking mode.
- Motion under 200 ms, for sheets, dialogs and toasts only; respect "reduce motion".
- Light and dark follow the phone, with a toggle to override it.

## Brand

- **Wordmark:** "Tastebook" in Bricolage Grotesque 800, cobalt.
- **Mark:** an enamel dish seen from above: a surface-coloured circle with a cobalt rim, an inner hairline ring and a few speckles. It's the home-screen icon. No custom logo work for now.
