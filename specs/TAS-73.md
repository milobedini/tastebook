---
issue: TAS-73
status: draft # draft | approved | building | done
branch: tastebook/tas-73-move-the-tokens-and-fonts-to-picnic-dark-only
pr:
---

# Move the tokens and fonts to Picnic, dark only

Linear: TAS-73

## Summary

The app still runs Enamel: a blue-grey `light-dark()` palette, Bricolage Grotesque and Atkinson Hyperlegible, a light theme and Enamel's token names (`cobalt`, `chip`, `yolk`). This work replaces them with Picnic's tokens and bundled fonts in one tokens file, makes the app dark only, moves Dino from `frontend/src/ui/` to `frontend/src/dino/`, and swaps every Enamel-only class for the Picnic token `docs/design.md` gives that element. The components keep their shapes, so TAS-75 to TAS-82 can restyle each one to its board on top of the new tokens.

It builds after TAS-86 (Storybook part 2), which removes `/styleguide`, the theme switcher and its tests, and moves the fonts and theme e2e checks to `e2e/home.spec.ts`. This spec assumes that state of `main`.

Evidence: feature — every page changes colour and type for people using Tastebook.
Design: skip — `docs/design.md` (Colour, Type, Space and shape) and `docs/design/dino/foundations.dc.html` give every value; no new component, variant or layout.

## Required reading

- `AGENTS.md`: hard constraints, Layout (line 94 changes) and Standards (contrast 4.5:1, 44 px targets).
- `docs/design.md`, Colour, Type, Space and shape, States (Focus) and Components: every value and the element each token is for.
- `docs/design/dino/foundations.dc.html`, line 15: the boards' token values, which the tokens file must equal.
- `frontend/src/ui/enamel.css`: the file this replaces; keep its structure (`@theme static`, `initial` resets, `:root`, `@layer base`, the reduced-motion block).
- `frontend/src/ui/cn.ts`: the `tailwind-merge` token lists that must match the new names.
- `specs/TAS-72.md`, Removal (part 2): what TAS-86 leaves in `e2e/home.spec.ts` and `src/test/setup.ts`.
- `specs/lessons/shadcn-registry-imports-cn-package.md`: `cn` lives in Dino, and this work edits the lesson's paths.
- `specs/lessons/storybook-under-vitest-has-no-manager.md`: forced pseudo-states don't apply under Vitest, so don't assert on hover or focus styles in a story test.

## Product behaviour

1. One tokens file, `frontend/src/dino/picnic.css`, holds every Picnic colour, type role, spacing base, corner and both shadows.
2. Every page shows the plum ground, Nunito body text and Instrument Serif headings.
3. Both typefaces load from the app's own host; nothing is requested from Google Fonts.
4. Amounts, times and servings counts are set in tabular figures.
5. The app is dark whatever the device's colour scheme, and offers no theme control.
6. Dino lives in `frontend/src/dino/`, and a PR touching it still gets the `dino` label.
7. No Enamel name is left in the code, config, lint rules or current docs.
8. The main action is peach, chosen and ticked controls are mint, and focus rings are Ink.
9. Every story passes axe and the 44 px check, and every e2e page passes axe.

## Technical design

- **Approach:** a `git mv` of `frontend/src/ui/` to `frontend/src/dino/` first, as its own commit with nothing else in it. Then `enamel.css` becomes `picnic.css` with Picnic's values and names, the font packages are swapped, the light theme goes, and each Enamel-only class in a component or page becomes its Picnic token.
- **API contract:** No change.
- **Blast radius:** see [Blast radius](#blast-radius) below.
- **Not changing:** any component's shape, size, border width, padding or behaviour; see [Out of scope](#out-of-scope).

### The tokens file

`frontend/src/dino/picnic.css` (renamed from `enamel.css`, then rewritten). Values are `docs/design.md`'s, in rem for type so text scales with the reader's setting.

```css
@import "tailwindcss";
@import "tw-animate-css";

/* static: emit every token, used or not, so the built CSS holds the whole set the Dino Design System is rebuilt from. */
@theme static {
  /* initial removes Tailwind's defaults, so only Picnic's tokens produce CSS. */
  --color-*: initial;
  --color-ground: #1c1233;
  --color-surface: #2a1d47;
  --color-ink: #fff4ea;
  --color-muted: #cbbfe0;
  --color-pop: #ffb38a;
  --color-field: #8f7fb0;
  --color-line: #3a2c5c;
  --color-peach: #ffb38a;
  --color-mint: #8fe3c0;
  --color-butter: #ffe08a;
  --color-pink: #ff9fc6;
  --color-on-pastel: #2a1440;
  --color-paper: #fff8ef;
  --color-tape: rgb(255 224 138 / 0.85);
  --color-dock: #fff4ea;
  --color-on-dock: #2a1440;
  --color-success: #8fe3c0;
  --color-warning: #ffe08a;
  --color-danger: #ff9a8a;
  --color-on-danger: #1c1233;
  --color-scrim: rgb(8 4 18 / 0.66);

  --font-*: initial;
  --font-serif: "Instrument Serif", Georgia, serif;
  --font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
  --default-font-family: var(--font-sans);

  --text-*: initial;
  --text-display-xl: 2.875rem;         /* 46 / 44, 400 */
  --text-display-xl--line-height: 2.75rem;
  --text-display-xl--font-weight: 400;
  /* display-l 2.125rem / 2.25rem 400; title 1.75rem / 1.875rem 400; caption 1.3125rem / 1.375rem 400;
     step-number 6rem / 5rem 400; step 1.4375rem / 2.125rem 700; timer 2.375rem / 2.5rem 800;
     body 1rem / 1.5rem 600; small 0.8125rem / 1.0625rem 700; label 0.9375rem / 1.25rem 800 */

  /* Picnic's 4 px base; its steps (4 to 48 px) are spacing 1, 2, 3, 4, 5, 6, 8 and 12. */
  --spacing: 0.25rem;

  --radius-*: initial;
  --radius-pill: 999px;
  --radius-sheet: 32px;
  --radius-timer: 28px;
  --radius-card: 24px;
  --radius-note: 20px;
  --radius-check: 10px;

  /* Nothing else has a shadow (docs/design.md, Space and shape). */
  --shadow-*: initial;
  --shadow-press: 0 5px 0 var(--color-on-pastel);
  --shadow-lift: 0 12px 28px rgb(0 0 0 / 0.35);
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;

  --default-transition-duration: 120ms;
  --default-transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

:root {
  color-scheme: dark;
  /* Picked by a recipe's cuisine slug at run time, never as a utility class; they go with the cuisine plate (TAS-81). */
  --cuisine-italian: #e2583e;
  /* …the other five cuisine colours, unchanged */
}

@layer base {
  body { @apply bg-ground text-body text-ink; }
  h1, h2, h3 { @apply font-serif; }
  h1 { @apply text-display-xl; }
  h2 { @apply text-title italic; }
  h3 { @apply text-caption italic; }
  a { @apply text-ink underline decoration-field decoration-2 underline-offset-3 hover:decoration-ink; }
  :focus-visible { @apply outline-3 outline-offset-0 outline-ink; }
  a:focus-visible { @apply outline-offset-2; }
  ::selection { @apply bg-pop/40 text-ink; }
}

/* the prefers-reduced-motion block, unchanged */
```

Write every `--text-*` role out in full, three lines each, as `display-xl` shows. Each role's size, line height and weight is `docs/design.md`'s Type table divided by 16. Type roles carry no family or style, because Tailwind's `--text-*` can't: a serif role is used with `font-serif`, and an italic one with `italic` (the base rules do this for `h1` to `h3`).

What goes: the `light-dark()` pairs, `cobalt`, `on-cobalt`, `chip`, `yolk`, `on-yolk`, `--font-display`, `--font-body`, `--text-display-m`, `--radius-photo`, `--radius-field`, `--plate`, and both `:root[data-theme=…]` rules.

### Fonts

- `frontend/package.json`: remove `@fontsource-variable/bricolage-grotesque` and `@fontsource/atkinson-hyperlegible`; add `@fontsource/instrument-serif` `^5.3.0` and `@fontsource/nunito` `^5.3.0` (both OFL-1.1) with `pnpm --filter frontend add` and `remove`, so `pnpm-lock.yaml` follows.
- `frontend/src/main.tsx:7-10` and `frontend/.storybook/preview.tsx:4-7` import, in this order:

```ts
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './dino/picnic.css'; // '../src/dino/picnic.css' in preview.tsx
```

- Tabular figures: Nunito's latin 600, 700 and 800 have no `tnum` feature, but every digit is 600 units wide (checked with fontTools in the spec run), so figures line up as they are. The `tabular-nums` classes in `recipes-page.tsx:68`, `recipe-ingredients.tsx:38`, `recipe-facts.tsx:43` and `servings-stepper.tsx:33` stay, so a future face with `tnum` uses it.
- `frontend/.storybook/preview.tsx`: delete `beforeAll` and its comment (lines 13-16). With one theme there is nothing to set.

### Swapping Enamel's names

Each Enamel-only class becomes the token `docs/design.md` gives that element. Shared names (`ground`, `surface`, `ink`, `muted`, `line`, `field`, `success`, `warning`, `danger`, `on-danger`, `scrim`, and the text and radius names that stay) keep their classes and take Picnic's values. Paths are after the move to `src/dino/`.

| File | From | To | Because (`docs/design.md`) |
| --- | --- | --- | --- |
| `dino/button.tsx:8` (base) | `disabled:bg-chip` | `disabled:bg-surface` | Disabled: a Surface fill |
| `dino/button.tsx:12` primary | `bg-cobalt text-on-cobalt` | `bg-peach text-on-pastel` | Peach is the main action; text on a pastel is On pastel |
| `dino/button.tsx:13` secondary | `border-cobalt bg-transparent text-cobalt` | `border-field bg-transparent text-ink` | Secondary: a 2 px field outline |
| `dino/button.tsx:14` ghost | `hover:bg-chip` | `hover:bg-surface` | Hover: ghost buttons fill with Surface |
| `dino/checkbox.tsx:10` | `text-on-cobalt`, `data-[state=checked]:border-cobalt data-[state=checked]:bg-cobalt` | `text-on-pastel`, `data-[state=checked]:border-mint data-[state=checked]:bg-mint` | Ticked boxes fill mint |
| `dino/icon-button.tsx:19` | `disabled:bg-chip` | `disabled:bg-surface` | Disabled |
| `dino/icon-button.tsx:19` | `aria-pressed:border-cobalt aria-pressed:bg-cobalt aria-pressed:text-on-cobalt` | `aria-pressed:border-pink aria-pressed:bg-pink aria-pressed:text-on-pastel` | A toggle that's on fills with its colour, pink for Favourite (its only use) |
| `dino/filter-chip.tsx:13` | `data-[state=on]:border-cobalt data-[state=on]:bg-cobalt data-[state=on]:text-on-cobalt` | `data-[state=on]:border-mint data-[state=on]:bg-mint data-[state=on]:text-on-pastel` | On: mint fill |
| `dino/removable-chip.tsx:6` filled | `border-cobalt bg-cobalt text-on-cobalt` | `border-mint bg-mint text-on-pastel` | It shows a filter that's on |
| `dino/removable-chip.tsx:7` outline | `border-cobalt bg-surface text-cobalt` | `border-field bg-surface text-ink` | Off: field outline |
| `dino/segmented-control.tsx:28` | `data-[state=on]:bg-cobalt data-[state=on]:text-on-cobalt` | `data-[state=on]:bg-mint data-[state=on]:text-on-pastel` | The chosen one is mint |
| `dino/servings-stepper.tsx:31,41` | `border-0 bg-chip` | `border-0 bg-line` | Line is the one fill a step lighter than Surface, as chip was |
| `dino/recipe-card.tsx:17` | `border-cobalt`, `has-focus-visible:outline-cobalt` | `border-transparent`, `has-focus-visible:outline-ink` | A filled panel has a transparent border, which forced colours draws; focus is Ink |
| `dino/tag.tsx:2` | `bg-yolk text-on-yolk` | `bg-butter text-on-pastel` | Nearest pastel to yolk (as agreed in the interview); TAS-81's stickers settle each colour |
| `dino/input.tsx:10`, `dino/native-select.tsx:10` | `disabled:bg-chip`, `rounded-field` | `disabled:bg-surface`, `rounded-pill` | Disabled; fields are pills |
| `dino/banner.tsx:27` | `rounded-field` | `rounded-note` | 20 px for notes and banners |
| `dino/sonner.tsx:9-10` | `rounded-field bg-ink … text-ground`; action `text-ground` | `rounded-pill bg-dock … text-on-dock`; action `text-on-dock` | Toast: dock colours, pill |
| `dino/cuisine-plate.tsx:22`, `dino/recipe-photo.tsx:47` | `rounded-photo` | (removed) | Photos sit square, as in a polaroid |
| `dino/cuisine-plate.tsx:27` | `fill="var(--plate)"` | `fill="var(--color-paper)"` | `--plate` was Enamel's; Paper is the nearest Picnic token |
| `recipes/ingredient-picker.tsx:48` | `rounded-field`, `shadow-lg` | `rounded-card`, (removed) | A panel is 24 px; the combobox list has no shadow |
| `recipes/ingredient-picker.tsx:66` | `rounded-field`, `data-[selected=true]:bg-chip`, `data-[selected=true]:outline-cobalt` | `rounded-note`, `data-[selected=true]:bg-line`, `data-[selected=true]:outline-ink` | The panel's 24 px less the list's 4 px padding; the active option has a Line fill and the focus outline |
| `app/home-page.tsx:67` | `className="font-extrabold text-cobalt text-display-xl"` | `className="italic"` | The wordmark is Instrument Serif italic in Ink; the `h1` base rule gives the rest |

`frontend/src/dino/cn.ts` (edit): the comment says "Picnic's names", and the lists become:

```ts
theme: {
  text: ['display-xl', 'display-l', 'title', 'caption', 'step-number', 'step', 'timer', 'body', 'small', 'label'],
  radius: ['pill', 'sheet', 'timer', 'card', 'note', 'check'],
  shadow: ['press', 'lift']
}
```

Without `shadow`, `tailwind-merge` reads `shadow-press` as a shadow colour, so `cn('shadow-press', 'shadow-lift')` keeps both.

### Enamel names elsewhere

| File | Change |
| --- | --- |
| `frontend/components.json:8` | `"css": "src/dino/picnic.css"` |
| `frontend/playwright.config.ts:31` | "picnic.css then collapses transitions, so axe never reads a colour mid-transition." |
| `tools/biome/no-arbitrary-radius.grit:9` | message: "Use one of Picnic's corner tokens (rounded-pill, -sheet, -timer, -card, -note, -check), not an arbitrary radius." |
| `AGENTS.md:94` | The Layout line below, its description starting in the same column as the lines around it |
| `docs/design.md:7` | The paragraph becomes: "**Moving to Picnic.** The code runs Picnic's tokens and fonts (`frontend/src/dino/picnic.css`), but each component keeps its old shape until the Dino project restyles it to its board. Until a component has moved, build with it as it is and add no new styling to it; anything that needs new visual work is designed in Picnic." |
| `specs/lessons/shadcn-registry-imports-cn-package.md:5` | "change the import to `@/dino/cn` (Dino's `cn`, whose `tailwind-merge` knows the token names)" |

```text
  src/dino/         Dino, the design-system components: shadcn/ui restyled, Picnic's tokens in picnic.css; add one with pnpm --filter frontend ui:add <name>; each component's stories sit beside it (`*.stories.tsx`)
```

### The move to `src/dino/`

`git mv frontend/src/ui frontend/src/dino`, then:

- Imports: `@/ui/…` becomes `@/dino/…` in every Dino file, and `'../ui'` becomes `'../dino'` in `frontend/src/recipes/` (six files) and `frontend/src/app/` (`home-page.tsx`, `not-found-page.tsx`). `main.tsx` and `preview.tsx` take the CSS path from [Fonts](#fonts).
- `frontend/components.json:15-19`: every alias `@/ui` becomes `@/dino`, and `utils` becomes `@/dino/cn`.
- `.github/labeler.yml:4`: `any-glob-to-any-file: frontend/src/dino/**`.
- `AGENTS.md:81`: "`src/dino/` holds the design-system components". `AGENTS.md:94`: the path, as above. `AGENTS.md:157`: "A PR that changes Dino (`frontend/src/dino/`)".
- `docs/design.md:146`: `frontend/src/ui/` and `src/ui/` become `frontend/src/dino/` and `src/dino/`.
- `specs/lessons/shadcn-registry-imports-cn-package.md:4` and `specs/lessons/wikimedia-photos-load-anonymously.md:4`: **Paths** say `frontend/src/dino/`. Their **Why** lines are history and stay.

### Steps

1. **Start from TAS-86.** Merge `main` into this branch once TAS-86 (Storybook part 2) has merged.
   Done when: `frontend/src/app/styleguide/` and `frontend/e2e/styleguide.spec.ts` don't exist, and `frontend/e2e/home.spec.ts` has the fonts and theme tests.
2. **Move Dino to `src/dino/`.** As in [The move](#the-move-to-srcdino); one commit, `Move Dino from src/ui to src/dino`, with no other change.
   Done when: `pnpm lint` and `pnpm test` pass, and `rg 'src/ui|@/ui|\.\./ui' frontend .github AGENTS.md docs/design.md specs/lessons` finds nothing.
3. **Swap the fonts.** `frontend/package.json`, `pnpm-lock.yaml`, `frontend/src/main.tsx`, `frontend/.storybook/preview.tsx` (edit)
   Done when: `pnpm install --frozen-lockfile` passes and `pnpm build` emits Instrument Serif and Nunito `.woff2` files in `frontend/dist/assets/`.
4. **Write the tokens file and drop the light theme.** `frontend/src/dino/enamel.css` → `picnic.css` (`git mv`, then rewrite); `frontend/src/dino/cn.ts`, `frontend/components.json`, `frontend/.storybook/preview.tsx` (edit)
   Done when: every value in the file equals `docs/design.md` and `foundations.dc.html:15`, and `pnpm --filter frontend build-storybook` succeeds.
5. **Swap each Enamel-only class.** Every file in [Swapping Enamel's names](#swapping-enamels-names) (edit)
   Done when: `rg -n -e '\b(bg|text|border|outline|ring|fill|stroke|decoration)-(cobalt|on-cobalt|chip|yolk|on-yolk)\b' -e '--color-(cobalt|chip|yolk)' -e 'rounded-(photo|field)\b' -e 'text-display-m\b' -e 'font-(display|body)\b' -e 'shadow-lg' -e '--plate' frontend/src` finds nothing.
6. **Rename what's left.** Every file in [Enamel names elsewhere](#enamel-names-elsewhere) (edit)
   Done when: `rg -i -e enamel -e bricolage -e atkinson -e 'data-theme' -e 'dataset.theme' -e 'light-dark' frontend tools .github AGENTS.md docs/design.md specs/lessons GLOSSARY.md` finds only `docs/design.md`'s lines 3 and 104, which say what Picnic replaced.
7. **Update the e2e checks.** `frontend/e2e/home.spec.ts` (edit)
   Done when: `pnpm test:e2e` passes with the cases in Tests.
8. **Run everything.** Done when: every Validation criterion below passes.

Steps 3 to 6 go in one commit (`Move the tokens and fonts to Picnic, dark only`), because a removed token silently drops its classes, so no smaller commit keeps the app looking whole.

### Tests

Every story already fails on an axe violation or a control under 44 px, and every page the e2e specs visit fails on an axe violation (`e2e/fixtures.ts`). They are the net for the new colour pairs and the larger type; none needs a change for that.

- `frontend/e2e/home.spec.ts` (edit the tests TAS-86 moved here)
  - fonts, on `/` waiting for the heading "Tastebook", asserts: the loaded font families include `Instrument Serif` and `Nunito`, and no request went to `fonts.googleapis.com` or `fonts.gstatic.com`.
  - theme, one `for` loop over the colour schemes `dark` and `light` with `page.emulateMedia({ colorScheme })`, asserts: `body` has `background-color` `rgb(28, 18, 51)` and `html` has `color-scheme` `dark`, for both.
- `frontend/src/dino/button.stories.tsx` (edit)
  - `Primary` gains a `play`, asserts: the button "Save recipe" has computed `background-color` `rgb(255, 179, 138)` and `color` `rgb(42, 20, 64)` (peach and On pastel, the swap for every main action).
- `frontend/src/dino/filter-chip.stories.tsx` (edit)
  - `IsOn` gains a `play`, asserts: "Under 30 min" has computed `background-color` `rgb(143, 227, 192)` (mint).

Then the checks in `AGENTS.md`: `pnpm lint`, `pnpm test` (unit and storybook projects), `pnpm build`, `pnpm --filter frontend build-storybook`, `pnpm test:e2e`.

## Blast radius

- **`frontend/src/dino/index.ts` and every `@/dino/*` path.** Every page imports Dino. Safe because the move is one `git mv` plus path edits, and `tsc -b` in `pnpm lint` fails on any import left behind. Look where a symbol search stops: `components.json` aliases, the labeler glob, `main.tsx`'s and `preview.tsx`'s CSS import (strings, not modules), and the lessons' **Paths**.
- **The base rules in `picnic.css`.** `h1` to `h3`, `a`, `:focus-visible` and `::selection` style every page. Re-check on `/`, `/recipes` and a recipe page that headings are serif, links are Ink with a Field underline, and the axe checks pass. `e2e/phone-width.spec.ts` guards reflow at 320 px against the larger 46 px `h1` and its long recipe title.
- **The `initial` resets.** `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*` and `--text-shadow-*` remove Tailwind's defaults, so any default class (`rounded-lg`, `shadow-md`) stops producing CSS without an error. Today only `shadow-lg` in `ingredient-picker.tsx:48` uses one, and this work removes it; re-check with `rg -e 'rounded-(xs|sm|md|lg|xl|2xl|3xl|4xl)\b' -e 'shadow-(2xs|xs|sm|md|lg|xl|2xl)\b' -e 'drop-shadow' -e 'inset-shadow' frontend/src`.
- **`cn.ts`'s lists.** Every component merges classes through it. A text or radius name missing from them makes `tailwind-merge` drop a class next to a colour (`text-small` beside `text-ink`); the lists above name every token.
- **TAS-75 to TAS-82.** Their descriptions name `src/ui` paths and Enamel tokens; they build on this, so their specs read the new names. Nothing to change here.
- `vercel.json` needs no change: no new build tool.

## Decisions

- Swap each Enamel-only class for its Picnic token in this PR, rather than keeping `cobalt`, `chip` and `yolk` as aliases, because then no Enamel name is left once this merges and the alias deletion has no owner spread across seven restyles. Asked: swap now or alias until the restyles? → Swap each use now.
- Build after TAS-86, because TAS-86 deletes `/styleguide`, the theme switcher and its tests; going first would mean rewriting files TAS-86 then deletes, and leaving TAS-86's spec with stale paths. Asked: wait for TAS-86? → Wait for TAS-86.
- One PR, with the move to `src/dino/` as its own first commit, because the rest is about 25 files of small class edits plus one CSS file; the rename commit reads as a pure move.
- The tokens file is `picnic.css`, keeping `enamel.css`'s structure, because the design system's name is how `docs/design.md` and the boards refer to the look, and one file the artifact is rebuilt from is what the issue asks for.
- `@theme static` stays, with a new reason: the built CSS then carries every token, so the Dino Design System artifact (rebuilt by hand on claude.ai) can load the full set, used or not.
- Font families are `--font-serif` and `--font-sans`, Tailwind's own names, so `--default-font-family` and `font-sans` work with no extra mapping; `font-display` and `font-body` go.
- Type roles carry size, line height and weight only; family and italic go with the class (`font-serif italic`), because Tailwind's `--text-*` can't hold them.
- Spacing keeps Tailwind's single `--spacing` multiplier, written out as `0.25rem` (Picnic's 4 px base), rather than a closed scale, because components use off-scale steps today (`gap-2.5`, `px-3.5`) that the restyles replace; a closed scale here would break them silently.
- Corner names follow the doc's uses: `pill`, `sheet`, `timer`, `card`, `note` (notes and banners) and `check`. Polaroids are square, so they need no token; `photo` and `field` go.
- The default transition becomes 120 ms ease-out, Picnic's state-change timing; the dialog keeps its explicit `duration-150`.
- Selected text is Pop at 40% under Ink, set once in the base layer, as `docs/design.md` Colour says.
- `--plate` goes and the cuisine plate draws on Paper; the six cuisine colours stay until TAS-81 replaces the plate, because the plate is the only no-photo fallback until then.
- No light theme in Storybook either: the preview's `beforeAll` goes, since `:root` is dark for every story.

## Assumptions

- TAS-86 merges with `e2e/home.spec.ts` holding the fonts and theme tests and `src/test/setup.ts` without the theme reset, as `specs/TAS-72.md` says. Confirm with: the implement stage, at step 1.
- `h3` (an ingredient group's name, today's only one) uses Caption size in serif italic, one step under Title, as `docs/design.md` has no third heading role. Confirm with: Milo, at approval.
- `Tag` takes butter until TAS-81 turns it into stickers, though difficulty and "One-pot" aren't time or heads-ups. Confirm with: Milo, at approval.
- The servings stepper's buttons fill with Line, not the board's outlined minus and mint plus, which TAS-76 builds. Confirm with: Milo, at approval.
- Links in text skip the doc's 4 px focus corners, as Picnic has no 4 px corner token and no Dino issue owns text links yet. Confirm with: Milo, at approval.
- The new colour pairs pass axe as `docs/design.md`'s contrast column says (the lowest text pair is Muted on Surface, 8.8:1). Confirm with: the implement stage, through the story and e2e axe checks.

## Out of scope

- Restyling any component's shape, size, border width, padding, states or behaviour: TAS-75 to TAS-81.
- The favicon, the mark and app icons: TAS-82.
- Rebuilding the Dino Design System artifact on claude.ai from `picnic.css`: done by hand after this merges, outside the repo.
- `docs/design.md`'s lines 3 ("it replaces Enamel") and 104 ("Enamel's cuisine plate goes"), and specs and lessons' **Why** lines, which record history.
- Breakpoints, layout widths and gutters (`docs/design.md`, Layout): the last Dino issue lays out the pages.
- The factory's Slack avatar, which is Enamel-coloured and lives outside this repo.

## Validation criteria

- [ ] `pnpm lint` (Biome, the radius rule and `tsc -b`) is clean.
- [ ] `pnpm test` passes the `unit` and `storybook` projects, with the two new `play` assertions.
- [ ] `pnpm build` and `pnpm --filter frontend build-storybook` succeed.
- [ ] `pnpm test:e2e` passes, including axe on every page and the 320 px reflow spec.
- [ ] The `rg` checks in steps 2, 5 and 6 find nothing beyond what they allow.
- [ ] The PR carries the `dino` label from the new glob.
- Evidence: feature: a laptop screenshot of `/recipes`, phone screenshots of `/`, `/recipes` and a recipe page, and a walkthrough, recorded by the verify stage.
