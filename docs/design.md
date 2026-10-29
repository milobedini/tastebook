# Design system: Picnic

Tastebook's look, agreed on a design canvas on 2026-10-29; it replaces Enamel. Warm and playful, like a picnic spread on a rug: a plum ground, pastels you can almost taste, photos as taped polaroids, and a serif with a little flourish over a rounded sans. The fun is rationed so the kitchen jobs (find a recipe, cook it, shop for it) stay calm and legible.

[`design/picnic/`](design/picnic/) holds the canvas's artboards: browse and recipe, cooking mode, and the shopping list, They're reference markup: their photos load only on the canvas. This file stays the rules. Change it through PRs like the code.

**Moving from Enamel.** The code still runs Enamel's tokens and components (`frontend/src/ui/enamel.css`, the `/styleguide` page) until the Dino project moves them onto Picnic: Storybook first, then the tokens and fonts, then each component. Until a part has moved, build with the components as they are and add no new styling to them; anything that needs new visual work is designed in Picnic.

## Principles

Judge every screen and component against two references: Nielsen Norman Group's [ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) and Apple's [design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles). Where they meet the rules below, the rules say how; where a rule is silent, the principles decide. Review cites them by name ("NN/g 1", "Apple Agency").

**NN/g's heuristics, as Tastebook applies them**

1. **Visibility of system status.** Every press shows a pressed state; anything that waits shows that it's working; a change is confirmed (a toast, an announced count).
2. **Match between the system and the real world.** Kitchen words, not system words: "Serves 4", "Makes 16 cookies", "Fruit and veg".
3. **User control and freedom.** Offer Undo rather than asking first, wherever the action can be undone; every sheet and dialog has a clear way out.
4. **Consistency and standards.** One look means one thing (peach means the main action, mint means chosen), and platform behaviour wins over invention: native selects, radio groups that answer to arrow keys.
5. **Error prevention.** Make the wrong input hard to give (number keyboards for numbers, limits on steppers) before explaining it.
6. **Recognition rather than recall.** Show what's on (filters as chips), show options rather than asking people to remember them; an icon alone only where it's universally known.
7. **Flexibility and efficiency of use.** Keyboard paths for desk use, large targets for the kitchen; text that scales with the reader's setting.
8. **Aesthetic and minimalist design.** Every element earns its place, the playful ones most of all (see [The fun, rationed](#the-fun-rationed)).
9. **Help users recognise, diagnose and recover from errors.** Say what went wrong and how to fix it, with an example, and offer the retry beside it.
10. **Help and documentation.** Help text under the field and a way out in every empty state, so nothing needs a manual.

**Apple's principles, as Tastebook applies them**

- **Purpose:** each screen does one household job well (find a recipe, cook it, shop for it).
- **Agency:** never trap someone in a flow; guided steps can be skipped; mistakes can be undone.
- **Responsibility:** collect only what Tastebook needs and say why; fonts are bundled so no visitor is sent to Google.
- **Familiarity:** build on platform conventions and keep a behaviour the same everywhere once it's set; give clear feedback.
- **Flexibility:** accessible from the start, at any text size, by touch, keyboard and screen reader.
- **Simplicity:** just what's necessary, in exactly the words needed, with a clear hierarchy (one primary action per screen).
- **Craft:** care for every detail, from a polaroid's tape to the wording of an error; shipping is not the finish line.
- **Delight:** warmth comes from the whole (the polaroids, the pastels, a squiggle under the right word), never decoration that slows the task.

## Voice

- British English, sentence case everywhere: "Save recipe", "Clear filters", never "Save Recipe".
- Plain and specific, and a little warm. A control says exactly what it does ("Add 10 things", "Next step"); the main action may be friendly ("Let's get cooking") as long as it stays clear.
- Errors say what's wrong and how to fix it, with an example: "Enter a number, like 4." No apologies, no "Invalid input".
- A dialog says exactly what will happen, with real numbers: "Your 12 private recipes will be deleted. Your 3 public recipes stay."
- An empty state says what's empty, why, and the way out: "No recipes match. Nothing is vegetarian, one-pot and under 30 minutes yet. Try removing a filter."
- No emoji in the interface.

## Colour

Tastebook has **one theme, dark**: no light theme and no toggle. The root sets `color-scheme: dark`, so native controls, scrollbars and the browser's own surfaces match.

Token names follow Tailwind's `--color-*` convention, so `--color-peach` is `bg-peach`, `text-peach` and so on. Contrast is against Ground unless noted; every text pair reaches 4.5:1 ([WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)) and field borders reach 3:1 ([1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast)).

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `--color-ground` | `#1c1233` | Page background | |
| `--color-surface` | `#2a1d47` | Quiet panels (a step's ingredients, icon buttons), sheets and dialogs | |
| `--color-ink` | `#fff4ea` | Text | 16.4 (14.2 on Surface) |
| `--color-muted` | `#cbbfe0` | Secondary text | 10.2 (8.8 on Surface) |
| `--color-pop` | `#ffb38a` | An emphasised word in a heading, its squiggle, the step number | 10.2 |
| `--color-field` | `#8f7fb0` | Borders of fields, outlined chips and checkboxes | 4.9 (4.3 on Surface) |
| `--color-line` | `#3a2c5c` | Hairlines between rows (decorative) | |
| `--color-peach` | `#ffb38a` | The main action; where you are (the current tab, the current step) | |
| `--color-mint` | `#8fe3c0` | Chosen and done: filters that are on, ticked boxes, finished steps, add buttons, the ingredients a step names | |
| `--color-butter` | `#ffe08a` | Time and heads-ups: timers, durations, "start the night before" notes | |
| `--color-pink` | `#ff9fc6` | Favourites and diet stickers | |
| `--color-on-pastel` | `#2a1440` | All text and icons on a pastel or on Paper | 9.5 peach, 10.9 mint, 12.8 butter, 8.7 pink |
| `--color-paper` | `#fff8ef` | Polaroid frames | 15.7 with On pastel |
| `--color-tape` | `rgb(255 224 138 / 0.85)` | The tape on a polaroid (decorative) | |
| `--color-dock` | `#fff4ea` | The floating tab bar and toasts | |
| `--color-on-dock` | `#2a1440` | Text and icons on the dock | 15.2 |
| `--color-success` | `#8fe3c0` | Status: done, saved | 11.8 |
| `--color-warning` | `#ffe08a` | Status: needs a look | 13.8 |
| `--color-danger` | `#ff9a8a` | Status: errors, destructive actions | 8.7 |
| `--color-on-danger` | `#1c1233` | Text on danger | 8.7 |
| `--color-scrim` | `rgb(8 4 18 / 0.66)` | The backdrop behind a sheet or dialog | |

The pastels stand out from the ground (9:1 and more), so they need no outline. Every pastel control still has a 2 px transparent border, which forced colours draws, so they stay outlined there.

## Type

| Role | Face | Size / line height | Weight |
| --- | --- | --- | --- |
| Display XL (screen titles) | Instrument Serif | 46 / 44 px | 400, one word may be italic |
| Display L (sheet titles) | Instrument Serif italic | 34 / 36 px | 400 |
| Title (section headings) | Instrument Serif italic | 28 / 30 px | 400 |
| Caption (polaroid captions) | Instrument Serif italic | 21 / 22 px | 400 |
| Step number (cooking mode) | Instrument Serif italic | 96 / 80 px | 400 |
| Step (cooking mode) | Nunito | 23 / 34 px | 700 |
| Timer | Nunito | 38 / 40 px | 800 |
| Body | Nunito | 16 / 24 px | 600 |
| Small | Nunito | 13 / 17 px | 700 |
| Label (buttons, chips) | Nunito | 15 / 20 px | 800 |

Both faces are under the SIL Open Font License and are **bundled with the app**: never loaded from Google Fonts, which would send every visitor's IP address to Google (see UK GDPR in `AGENTS.md`, Standards) and fail offline. Instrument Serif has one weight, so hierarchy comes from size and italics, never bold serif. Numbers that line up (amounts, times, timers) use tabular figures.

## Space and shape

- **Spacing:** a 4 px base: 4, 8, 12, 16, 20, 24, 32, 48. Space siblings with `gap`, not margins. Screens have 20 px side gutters.
- **Corners:** pill (999 px) for controls (buttons, chips, fields, steppers) and the dock; 32 px for a sheet's top corners; 28 px for the timer card; 24 px for cards and panels; 20 px for notes; 10 px for checkboxes; square for polaroids.
- **Shadows:** the **press shadow** (`0 5px 0` in On pastel) sits under the screen's main action and the timer card, so they look pressable; pressed, they sink 3 px and the shadow shrinks to match. The **lift** (`0 12px 28px rgb(0 0 0 / 0.35)`) sits under polaroids, the dock and sheets. Nothing else has a shadow.
- **Photos:** in a polaroid (below), 4:3 in lists and 7:5 at the top of a recipe, always with the credit. No photo: still to design (Enamel's cuisine plate goes).
- **Motion:** 150 ms ease-out fades and slides for sheets, dialogs and toasts; never over 200 ms. Nothing moves on its own except a running timer. `prefers-reduced-motion` turns it all off.

## The fun, rationed

Picnic works only while its playful parts stay rare. Review checks each screen against these.

- **Polaroids** frame photos in lists and at the top of a recipe: a Paper frame (10 px, 8 px on small ones) with a Caption underneath, tilted 2 to 4 degrees, alternating direction. A featured polaroid may carry tape. The recipe's photo credit sits inside its frame.
- **Tilt** is for polaroids, stickers and browse's filter chips (1 to 2 degrees) only. Never tilt text you read for more than a glance, anything you type into, the method, ingredient lists, dialogs, or any control in cooking mode.
- **Stickers** carry a recipe's diet tags or a featured recipe's time, in pink, mint or butter, tilted 6 to 12 degrees; two at most on one photo. They describe and are never buttons.
- **The squiggle** goes under one word of a screen's title, a recipe's name or a step number, in Pop. One per screen.
- **Doodles** (a hand-drawn arrow and a note in italic serif, like "start it tonight!") go on browse and empty states only, one per screen, and repeat nothing the screen doesn't already say in words: they're hidden from screen readers.
- **Blobs** (three fixed irregular shapes in peach, butter and mint) hold a recipe's prep, cook and soaking times, and nothing else.
- **Dotted leaders** join an ingredient to its amount wherever amounts are listed.

## Components

The set lives in `frontend/src/ui/` (Dino: shadcn/ui, restyled) and is exported from its `index.ts`. Build pages from these; add a component to `src/ui/` on its third use (`AGENTS.md`, rule of three). To add one from shadcn/ui, run `pnpm --filter frontend ui:add <name>`, restyle it to these tokens and export it from `index.ts`. The Dino project designs each component's states (hover, pressed, focus, disabled, loading) before it's built; the notes below are the direction.

| Component | Notes |
| --- | --- |
| Button | Primary: peach fill, the press shadow, one per screen. Secondary: a 2 px field outline. Ghost: no fill. Danger: danger fill. 44 px tall; 64 px in cooking mode. |
| Icon button | A 44 px circle on Surface (48 px in cooking mode); a toggle that's on fills with its colour (pink for Favourite). Always has an accessible name, and a toggle keeps one name while `aria-pressed` says whether it's on. |
| Field | Pill, a 2 px field border, visible label above (visually hidden only for search), help text below, error replaces help in danger with an icon and says how to fix it. |
| Filter chip | A toggle (`aria-pressed`), pill. Off: field outline. On: mint fill with a check icon, so the state never rests on colour alone. A removable chip names what it removes in its label. |
| Sticker | Replaces Tag: describes a recipe (Vegan, Gluten-free) on its photo. Not interactive. |
| Stepper | Servings: minus (outlined), "Serves 4", plus (mint), or a yield: "Makes 16 cookies"; the count is announced (`aria-live="polite"`). |
| Segmented control | Two to four options, one chosen, as a radio group that answers to arrow keys. |
| Checkbox row | Shopping list rows: 48 px tall, a 28 px box with 10 px corners; ticked, the box fills mint with a check and the row is struck through in muted and moves to the end of its group. |
| Polaroid card | Replaces Recipe card: a polaroid with the recipe's name as its caption; meta below it in Small muted where the list needs it. |
| Note | A butter panel for heads-ups ("Left out salt, water and vegetable oil: you probably have them"), with at most one action. |
| Banner | A 2 px border in a status colour with its icon: warning for an import's gaps, success for a clean import. |
| Toast | Dock colours, pill, a short message and at most one action ("Saved to Favourites · Undo"). |
| Sheet | Slides up over a scrim, Surface colour, 32 px top corners, a grab handle, a title in Display L, a close button. For light tasks (adding a recipe to the list, filters). |
| Dialog | For anything that can't be undone: says exactly what happens; the danger button names the action ("Delete account"), the other is "Cancel". |
| Empty state | What's empty and why, the way out ("Clear filters"), and perhaps the screen's one doodle. |
| Dock | The tab bar: a floating pill in dock colours, 62 px tall; the current tab is a peach pill with its label, the others are icons with accessible names. |

**Cooking mode** keeps the screen awake and drops the playful parts that get in the way: a progress bar of segments (mint done, peach current), the step number in Step number type with its squiggle, the step in Step type with the ingredients it names in mint, and Back and Next at 64 px. A duration in a step ("60 to 90 minutes") is a butter button that starts a timer; a running timer shows as a butter card with a ring and a pause button, and follows you to later steps as a small pill. A range counts to its first check, then says how much longer it may need. A step's own ingredients sit below it with their amounts.

## Rules

Review checks new UI against these.

**Colour**

- Peach only for the main action and where you are. One peach button per screen.
- Mint for chosen and done, butter for time and heads-ups, pink for favourites and diet stickers: never swapped, never decoration.
- Text on a pastel or on Paper is always On pastel.
- Success, warning and danger only for status, never decoration.
- Tokens only, never a literal colour.

**Shape**

- Pills for controls, 24 px for cards, 32 px for sheets, 10 px for checkboxes, square for polaroids.
- The press shadow only under the main action and the timer; the lift only under polaroids, the dock and sheets.
- Every pastel control has a 2 px transparent border, for forced colours.

**Type and icons**

- Instrument Serif for headings, captions, the step number and the wordmark only; Nunito for everything else.
- Fonts bundled with the app, never loaded from Google.
- [Lucide](https://lucide.dev) icons at a 2 to 2.5 px stroke. An icon on its own always has a label for screen readers.

**State**

- A chosen or ticked state shows an icon as well as its fill, so it survives forced colours and colour blindness.
- A list's active option (the one Enter picks while focus stays in a search field) carries the focus outline beside its fill.

**Touch and motion**

- Every control at least 44 px tall (WCAG 2.5.8 asks for 24); 48 px or more in cooking mode.
- Motion under 200 ms, for sheets, dialogs and toasts only; respect "reduce motion".
- Dark only: no light theme, no theme toggle.

## Brand

- **Wordmark:** "Tastebook" in Instrument Serif italic, in ink.
- **Mark:** still to design, for the home-screen icon; the current favicon (an orange book) goes.

## Still to settle

Decided in the Dino project, then written here: the pressed, focus, disabled and loading states of each component; a recipe with no photo; the mark; how tilted parts behave at the largest text sizes; and a check of every screen in forced colours.
