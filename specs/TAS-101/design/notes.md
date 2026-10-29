# TAS-101: Add an account menu to Dino's top bar — approved design

Canvas: https://claude.ai/artifact/QUdX8gPCdq2NVyzdxdE925

## Boards

- `Main.dc.html` — Top bar · phone: signed in, signed out, signed in with search open and not known yet (no account) at 390 px; signed in and signed out at 320 px, with the width sums.
- `Laptop.dc.html` — Top bar · tablet and laptop: signed in and signed out at 1280 px (search field) and 834 px (search button).
- `MenuOpen.dc.html` — Open menu · phone and laptop: opened from the keyboard at 390 px (focus on the first item) and with the pointer at 1280 px (pointer over Sign out); keyboard and pointer behaviour.
- `Avatar.dc.html` — Avatar: the spec (44 px Surface circle, Label L in Ink), what it shows (first letter, trimmed and upper-cased, accented letters, the UserRound fallback) and the account button's states (rest, hover, pressed, focus, expanded, no name).
- `Menu.dc.html` — Menu: the panel, heading and item spec; an item's states (rest, hover, pressed, focus); no-heading and long-heading variants; what it grows into.
- `TopBar.dc.html` — TopBar: its states at 390 px (no account, signed out, signed in, menu open, no name) and how the row is laid out on a phone and from 640 px.
- `ForcedColours.dc.html` — Forced colours: signed in, signed out, avatar focus and no name, the open menu with a focused item, the item under the pointer, the avatar expanded.

## Decisions

- The account end is the bar's third column (`minmax(0, 1fr) auto auto`), in row 1 at every width; the search field's own line on a phone spans all three columns. Tab order: wordmark, search, account.
- Column gap is 8 px under 640 px (24 px from 640 px up), so signed out fits at 320 px (119 + 8 + 44 + 8 + 93 = 272 of 280 px). Without an account the bar is unchanged from today (two columns, 24 px gap).
- Avatar: one size, a 44 px `radius-pill` circle, Surface fill, 2 px transparent border, the first letter in Label L (Nunito 19/24, 800) in Ink; never a pastel. No name: Lucide UserRound, 20 px, 2.5 stroke, `currentColor`.
- Avatar button states: hover fills with Line; pressed shrinks to 94% on Surface pressed; focus is the 3 px Ink ring, flush; expanded (menu open) is a Line fill with an Ink border. State changes take 120 ms, none with reduced motion.
- Sign in is a secondary Button (2 px Field outline), at every width: peach stays for the page's main action, and ghost would read as text beside the search circle.
- Menu panel: Surface, 2 px Field border (like the combobox's list), `radius-card` (24 px), 6 px padding, 2 px between items, no shadow; 224–320 px wide, never closer than 20 px to the screen's edge; drops 8 px below the avatar, right edges aligned; doesn't dim the page.
- Menu heading: Label (Nunito 15/20, 800) in Ink, 10/14/8 px padding, then a 1 px Line hairline; text, not an item; wraps, never truncates.
- Menu items: Body (Nunito 16/24, 600) in Ink, at least 44 px tall, 10 × 14 px padding, `radius-option` (16 px). Hover: Line fill, no ring. Pressed: Surface pressed, no shrink. Keyboard focus: Line fill and a 3 px Ink ring inset on the item's edge.
- Motion: the menu fades in and out over 150 ms ease-out; none with reduced motion.
- Forced colours: under forced colours the highlighted (pointer) item also takes the 3 px Highlight ring, since its Line fill drops.

## Proposed rule changes

None.

## Components

- Avatar (new) — built in this issue.
- Menu (new) — built in this issue.
- TopBar (changed: signed-in and signed-out ends) — built in this issue.

All three are built in TAS-101's own PR, as the spec's steps set out, so none is filed as a separate issue.
