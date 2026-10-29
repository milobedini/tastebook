---
issue: TAS-76
status: building # draft | approved | building | done
branch: tastebook/tas-76-restyle-chips-the-segmented-control-and-the-servings-stepper
pr: 80
---

# Restyle chips, the segmented control and the servings stepper in Picnic

Linear: TAS-76

## Summary

The filter chip, removable chip, segmented control and servings stepper still wear their pre-Picnic shapes. This restyles all four to the controls board (`docs/design/dino/controls.dc.html`) and `docs/design.md` (States, Components), rebuilds the segmented control from separate toggles into native radios with one tab stop and arrow keys, and makes the stepper's limit focusable (`aria-disabled`) and dashed. Every state gets a story and a fresh baseline. It ships in one PR, one commit per component, and unblocks TAS-83 (Picnic page layouts), which will switch on the browse tilt.

Evidence: feature — the recipe page's units and servings and the recipe list's filters look and behave differently in production.
Design: skip — the controls board already draws every component and state here; build to it.

## Required reading

- `AGENTS.md`: hard constraints, Tests, rule of three.
- `docs/design.md`: Colour, States, The fun, rationed (Tilt), Components (Filter chip, Stepper, Segmented control), Rules (State, Shape).
- `docs/design/dino/controls.dc.html` and `controls.dc.png`: the source of every value below. Its `<style>` block (lines 32 to 54) is the reference CSS for `.chip`, `.seg`, `.seg-opt`, `.st`.
- `docs/design/dino/forced-colours.dc.html`: "Chips, segments, checkboxes" holds because the chosen state carries a check; "Buttons": disabled stays dashed.
- `frontend/src/dino/checkbox-row.tsx` on PR #76 (TAS-78, open): mirror its group focus ring (`has-focus-visible:outline-3 has-focus-visible:outline-ink`) and its Is Focus story that targets the inner control with `pseudo.focusVisible`.
- `frontend/src/dino/button.stories.tsx`: mirror one story per variant and state.
- `specs/lessons/story-play-leaves-real-focus.md`: Is Focus stories force the ring with the pseudo-states class; play's focus is blurred before the shot.
- `specs/lessons/storybook-under-vitest-has-no-manager.md`: don't assert forced hover, pressed or focus styles in a play function; keep stateful stories' values in React state.

## Product behaviour

1. A filter chip that's off has a field outline; on, it's mint with a check.
2. A filter chip given `tilt` sits 1.5 degrees off straight; without it, it's straight.
3. A removable chip is mint with a cross and is named "Remove filter: Chickpeas".
4. The "With all of these" removable chip stays outlined, with a cross.
5. The segmented control is one tab stop, and arrow keys move the choice.
6. A screen reader reads each segment as a radio ("Metric, radio, 1 of 2, checked").
7. The chosen segment is mint with a check, and focus rings the whole group.
8. The stepper shows an outlined minus, the count, and a mint plus.
9. The stepper's count is announced politely and reads "Makes 16 cookies" for a yield.
10. At a limit, that stepper button is dashed, stays focusable and does nothing.
11. Every state of each component has a story whose baseline matches the board.
12. Under forced colours, chosen states keep their check and controls keep their outline.

## Technical design

- **Approach:** frontend only, in `frontend/src/dino/`. Two colour tokens join `picnic.css`. The four components are rewritten in place; their props stay the same except `FilterChip`, which gains an optional `tilt`. Their stories are rewritten to the board's states, and the callers' page tests and e2e specs move from `aria-pressed` buttons to radios and from `disabled` to `aria-disabled`.
- **API contract:** No change.
- **Blast radius:** see [Blast radius](#blast-radius).
- **Not changing:** the callers' code (`recipe-filter-panel.tsx`, `recipe-ingredients.tsx`, `recipe-page.tsx`, `active-filters.tsx`), `boards.ts`, `IconButton` and `Button` (TAS-75).

### Values from the board

All controls are 44 px tall (`min-h-11` or `size-11`), pills (`rounded-pill`), Label type (`text-label`: 15/20, weight 800), with a 2 px border (`border-2`) and `transition` (120 ms ease-out from the theme; reduced motion is already handled globally in `picnic.css`). Icons are Lucide at `size-4` with `strokeWidth={3}`, `aria-hidden="true"`, drawn in `currentColor` (Lucide's default).

| Component, state | Classes (Tailwind) | Board rule |
| --- | --- | --- |
| Chip off | `border-field bg-transparent text-ink px-4 gap-1.5` | `.chip` |
| Chip off, hover | `hover:border-ink hover:bg-surface` | `.chip:hover` |
| Chip off, pressed | `active:border-ink active:bg-line active:scale-96` | `.chip:active` |
| Chip on | `border-transparent bg-mint text-on-pastel pl-3`, check icon before the label | `.chip[aria-pressed="true"]` |
| Chip on, hover | `bg-mint-hover`, border stays transparent | |
| Chip on, pressed | `bg-mint-pressed scale-96`, border stays transparent | |
| Segmented track | `fieldset`: `inline-flex gap-0.5 rounded-pill bg-surface p-0.75`, no border | `.seg` |
| Segment | `relative inline-flex h-11 items-center gap-1.5 rounded-pill border-2 border-transparent px-4.5 text-label text-muted` | `.seg-opt` |
| Segment, hover (not chosen) | `bg-line text-ink` | `.seg-opt:hover` |
| Segment, pressed (not chosen) | `scale-97` (docs/design.md, States: "every other control shrinks a touch (97%)") | |
| Segment, chosen | `bg-mint text-on-pastel pl-3`, check icon before the label | `.seg-opt:has(input:checked)` |
| Segmented focus | the `fieldset` takes `has-focus-visible:outline-3 has-focus-visible:outline-ink` | `.seg:has(input:focus-visible)` |
| Stepper | `inline-flex items-center gap-2`, no track | `.stp` |
| Stepper count | `min-w-15.5 text-center text-label tabular-nums` | `.stp-val` |
| Minus | `size-11 border-field bg-transparent text-ink`; hover `border-ink bg-surface` | `.st-minus` |
| Plus | `size-11 border-transparent bg-mint text-on-pastel`; hover `bg-mint-hover`; pressed `bg-mint-pressed` | `.st-plus` |
| Step pressed | `active:scale-92` | `.st:active` |
| Step at its limit | `aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:border-field aria-disabled:bg-transparent aria-disabled:text-muted`; no hover or pressed change | `.st[aria-disabled="true"]` |

Every focus ring is the global `:focus-visible` rule in `picnic.css` (3 px Ink, flush), except the segmented control's, which goes on the group.

### Filter chip (`filter-chip.tsx`)

Stays a Radix `Toggle.Root` (it gives `aria-pressed` and `data-state`). On styles use `data-[state=on]:`; the on-state hover and pressed use `data-[state=on]:hover:bg-mint-hover` and `data-[state=on]:active:bg-mint-pressed`, and the off-state hover and pressed are written `data-[state=off]:hover:…` and `data-[state=off]:active:…` so the two never compete. `active:scale-96` applies to both. The label may still wrap (no `whitespace-nowrap`), since chip labels come from data and must reflow at 320 px (WCAG 1.4.10).

```ts
const tilts = { left: '-rotate-[1.5deg]', right: 'rotate-[1.5deg]' };

type FilterChipProps = {
  children: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  // Browse's quick filters only (docs/design.md, The fun, rationed); the caller alternates left and right.
  tilt?: keyof typeof tilts;
};
```

Render `{pressed && <Check aria-hidden="true" className="size-4" strokeWidth={3} />}` before `{children}`. Tailwind v4's `rotate-*` sets the `rotate` property and `scale-*` the `scale` property, so a tilted chip still shrinks when pressed.

### Removable chip (`removable-chip.tsx`)

Props and the `looks` map keep their shape (`filled`, `outline`). The base gains `min-h-11 border-2 text-label gap-1.5 transition active:scale-96` and loses `border font-bold text-small`.

```ts
const looks = {
  filled: 'border-transparent bg-mint text-on-pastel pl-3 pr-4 hover:bg-mint-hover active:bg-mint-pressed',
  outline: 'border-field bg-transparent text-ink px-4 hover:border-ink hover:bg-surface active:border-ink active:bg-line'
};
```

The cross stays after the label at `size-4`, now with `strokeWidth={3}`. `aria-label` stays `Remove filter: ${children}`.

### Segmented control (`segmented-control.tsx`)

Rebuilt as native radios. The props (`label`, `options`, `value`, `onValueChange`) don't change, so no caller changes.

```tsx
export const SegmentedControl = <Value extends string>({ label, options, value, onValueChange }: SegmentedControlProps<Value>) => {
  const name = useId();
  return (
    <fieldset className="inline-flex gap-0.5 rounded-pill bg-surface p-0.75 has-focus-visible:outline-3 has-focus-visible:outline-ink">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const chosen = option.value === value;
        return (
          <label key={option.value} className={cn(segment, chosen ? segmentChosen : segmentOther)}>
            {/* Covers the whole segment, not visually hidden, so its target is the segment's 44 px. */}
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={chosen}
              onChange={() => onValueChange(option.value)}
              className="absolute inset-0 m-0 cursor-pointer appearance-none rounded-pill opacity-0"
            />
            {chosen && <Check aria-hidden="true" className="size-4" strokeWidth={3} />}
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
};
```

- `segment`, `segmentChosen` and `segmentOther` are module constants holding the classes in the table above (`segmentOther` carries the hover and pressed classes, so the chosen segment has none).
- The radio is not `sr-only`: the preview's `afterEach` in `.storybook/preview.ts` fails any visible `input` under 44 px, and a 1 px clipped radio counts as visible. Opacity 0 over the whole segment keeps the click target, the 44 px check and the screen-reader radio.
- A `fieldset` keeps the `group` role named by its legend, so `getByRole('group', { name: 'Units' })` in the tests still finds it. No `role="radiogroup"` (Biome's `useSemanticElements` rejects a role a native element gives).
- The browser gives one tab stop per radio group and arrow keys that move and check; no key handling is written.

### Servings stepper (`servings-stepper.tsx`)

The props don't change. It stops using `IconButton` (whose `disabled` takes the button out of the tab order, and whose look TAS-75 is changing) and renders its own buttons through one module-private component with a look per button:

```ts
const stepLooks = {
  fewer: 'border-field bg-transparent text-ink not-aria-disabled:hover:border-ink not-aria-disabled:hover:bg-surface',
  more: 'border-transparent bg-mint text-on-pastel not-aria-disabled:hover:bg-mint-hover not-aria-disabled:active:bg-mint-pressed'
};

type StepButtonProps = {
  icon: LucideIcon;
  label: string;
  look: keyof typeof stepLooks;
  atLimit: boolean;
  onStep: () => void;
};
```

- `StepButton` renders `<button type="button" aria-label={label} aria-disabled={atLimit || undefined} onClick={atLimit ? undefined : onStep}>` with the base `inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-pill border-2 transition not-aria-disabled:active:scale-92`, its look, and the at-limit classes from the table. Its icon is `size-4`, `strokeWidth={3}`.
- At the limit the button keeps focus and a press does nothing; the count ("Serves 1") says why, so no extra line (docs/design.md, States: "A stepper at its limit needs no line").
- Under forced colours the at-limit button takes `forced-colors:border-[GrayText] forced-colors:text-[GrayText]`, matching the forced-colours board's dashed grey disabled control. These are CSS system colours, not literal colours.
- The wrapper becomes `<div className="inline-flex items-center gap-2">`: minus, then `<output aria-live="polite" className="min-w-15.5 break-words text-center text-label tabular-nums">`, then plus. The labels (`Serves 4`, `Makes 16 cookies`, `Fewer servings`, `More servings`, `Make fewer`, `Make more`) stay as they are.

### Tokens (`picnic.css`) and their doc

Add after `--color-mint` inside `@theme static`:

```css
  /* docs/design.md, States: hover moves a pastel 20% towards Ink; pressed, 14% towards On pastel. */
  --color-mint-hover: color-mix(in oklab, var(--color-mint) 80%, var(--color-ink));
  --color-mint-pressed: color-mix(in oklab, var(--color-mint) 86%, var(--color-on-pastel));
```

These give `bg-mint-hover` and `bg-mint-pressed`. Add two rows after `--color-mint` in the Colour table of `docs/design.md`:

```diff
 | `--color-mint` | `#8fe3c0` | Chosen and done: … | |
+| `--color-mint-hover` | Mint 80%, Ink 20% (`color-mix` in oklab) | A mint control under the pointer | |
+| `--color-mint-pressed` | Mint 86%, On pastel 14% (`color-mix` in oklab) | A mint control while pressed | |
```

### Forced colours

No `forced-colors:` rules are needed beyond the stepper's at-limit grey, because the board's rules hold through the design itself:

- Every mint control (chip on, removable chip, chosen segment, plus) has a 2 px transparent border, which forced colours draws.
- Every chosen state carries a check icon in `currentColor`.
- The off chip, outlined removable chip and minus keep their 2 px field border; at its limit a step button stays dashed.

### Stories

Story names follow the board's states. `isHover`, `isPressed` and `isFocus` come from `@/dino/story-states`. Baseline file names are `dino-<title>--<story>.png`.

| File | Stories (new in bold) |
| --- | --- |
| `filter-chip.stories.tsx` | Default, IsHover, IsPressed, IsFocus, IsOn, IsOnIsHover, IsOnIsPressed, **Tilted** |
| `removable-chip.stories.tsx` | Filled, IsHover, IsPressed, IsFocus, Outline, **OutlineIsHover**, **OutlineIsPressed**, **OutlineIsFocus** |
| `segmented-control.stories.tsx` | Default, IsHover, IsPressed, IsFocus |
| `servings-stepper.stories.tsx` | Default, Yield, AtMinimum, AtMaximum, IsHover, IsPressed, IsFocus |

- FilterChip **Tilted** renders four chips in a `div` with `flex gap-2`, as on the board: Quick (on, `tilt="left"`), Veggie (`right`), One-pot (`left`), Sweet (`right`), each holding its own pressed state.
- RemovableChip Outline stories use `{ children: 'With all of these', look: 'outline' }`.
- SegmentedControl: IsHover targets `label:not(:has(:checked))` with `pseudo.hover`; IsPressed the same selector with `pseudo.active`; IsFocus targets `input:checked` with `pseudo.focusVisible`, which the add-on rewrites inside the fieldset's `:has()`.
- ServingsStepper: Yield's args become `{ value: 16, max: 24, yieldUnit: 'cookies' }` to match the board. AtMinimum and AtMaximum use the stateful render. IsHover uses `isHover` (both buttons). IsPressed and IsFocus keep targeting `button[aria-label="More servings"]`, the board's "Plus pressed, with focus".

### Steps

1. **Add the mint state tokens.** `frontend/src/dino/picnic.css` (edit), `docs/design.md` (edit)
   Add `--color-mint-hover` and `--color-mint-pressed` and their two Colour table rows as above.
   Done when: `pnpm lint` passes and `bg-mint-hover` resolves in a built story.

2. **Restyle the filter chip.** `frontend/src/dino/filter-chip.tsx`, `filter-chip.stories.tsx` (edit)
   Apply the chip classes, the check icon and the `tilt` prop. Rewrite the stories per the table.
   Done when: the FilterChip stories pass in `pnpm test`.

3. **Restyle the removable chip.** `frontend/src/dino/removable-chip.tsx`, `removable-chip.stories.tsx` (edit)
   Apply the new base and looks. Add the Outline state stories.
   Done when: the RemovableChip stories pass in `pnpm test`.

4. **Rebuild the segmented control as radios.** `frontend/src/dino/segmented-control.tsx`, `segmented-control.stories.tsx` (edit); `frontend/src/recipes/recipe-page.test.tsx`, `frontend/src/recipes/recipes-page.test.tsx`, `frontend/e2e/recipe.spec.ts`, `frontend/e2e/recipes.spec.ts` (edit)
   Replace the toggles with radios as sketched. In the tests, every `getByRole('button', { name: 'Metric' | 'US' | 'With any' | 'With all' })` becomes `getByRole('radio', …)`, and every `toHaveAttribute('aria-pressed', 'true')` on them becomes `toBeChecked()` (`recipe-page.test.tsx:475,487,489,509,553`; `recipes-page.test.tsx:831,833,840,847,886`; `e2e/recipe.spec.ts:49,51`; `e2e/recipes.spec.ts:85`). In e2e, assert with `toBeChecked()` and press with `.check()`.
   Done when: the SegmentedControl stories, both page test files and `pnpm test:e2e` pass.

5. **Restyle the servings stepper.** `frontend/src/dino/servings-stepper.tsx`, `servings-stepper.stories.tsx` (edit); `frontend/src/recipes/recipe-page.test.tsx` (edit)
   Replace `IconButton` with `StepButton`, drop the track, apply `aria-disabled`. At `recipe-page.test.tsx:408`, replace `toBeDisabled()` with the at-limit assertions under Tests.
   Done when: the ServingsStepper stories and `recipe-page.test.tsx` pass.

6. **Refresh the baselines.** `frontend/visual/baselines/dino-{filterchip,removablechip,segmentedcontrol,servingsstepper}--*.png` (edit, and new for the four new stories)
   Run the **Update screenshots** workflow on the branch (never locally). Compare each new image with `controls.dc.png`.
   Done when: CI's `test:visual` passes and every story in the Stories table has a baseline (27 files).

Commit per step: tokens, filter chip, removable chip, segmented control (with its test changes), stepper (with its test change), then the workflow's baseline commit.

### Tests

- `frontend/src/dino/filter-chip.stories.tsx`
  - Default: the chip starts unpressed and straight, then click, then click, asserts: `aria-pressed` goes `false`, `true`, `false`; the chip contains no `svg` while off and one `svg` while on; `toHaveStyle({ rotate: 'none' })`.
  - IsOn, asserts: `toHaveStyle({ backgroundColor: 'rgb(143, 227, 192)' })` and the chip contains an `svg`.
  - Tilted, asserts: the Quick chip `toHaveStyle({ rotate: '-1.5deg' })` and the Veggie chip `toHaveStyle({ rotate: '1.5deg' })`.
- `frontend/src/dino/removable-chip.stories.tsx`
  - Filled: click "Remove filter: Italian", asserts: `onRemove` called once and the chip `toHaveStyle({ backgroundColor: 'rgb(143, 227, 192)' })`.
  - Outline, asserts: the button named "Remove filter: With all of these" has `backgroundColor` `rgba(0, 0, 0, 0)` and `borderTopColor` `rgb(143, 127, 176)`.
- `frontend/src/dino/segmented-control.stories.tsx`
  - Default, step "Choose US": click US, asserts: radio US `toBeChecked()`, Metric `not.toBeChecked()`, the US segment's label contains an `svg` and Metric's doesn't.
  - Default, step "Choose with the keyboard": click Metric, blur it, `userEvent.tab()`, asserts: Metric has focus; `userEvent.keyboard('{ArrowRight}')`, asserts: US has focus and is checked; `userEvent.tab()`, asserts: neither radio has focus (one tab stop).
- `frontend/src/dino/servings-stepper.stories.tsx`
  - Default: click "More servings" then "Fewer servings" four times, asserts: "Serves 5", then "Serves 1"; "Fewer servings" has `aria-disabled="true"` and "More servings" has no `aria-disabled`; one more click on "Fewer servings" leaves "Serves 1"; "Fewer servings" `toHaveFocus()` after the click.
  - Yield: click "Make more", asserts: "Makes 17 cookies".
  - AtMaximum: click "More servings", asserts: "Serves 12" still shows and the button has `aria-disabled="true"`.
- `frontend/src/recipes/recipe-page.test.tsx`
  - The servings case (line 408): asserts `Fewer servings` has `aria-disabled="true"`; clicking it once more leaves the status at "Serves 1" and the amounts unchanged.
  - The units cases: as before, through radios, asserts: `toBeChecked()` on the chosen radio.
- `frontend/src/recipes/recipes-page.test.tsx`
  - The any or all cases: as before, through radios, asserts: `toBeChecked()`, the URL search and the `filtersOn()` names unchanged.
- `frontend/e2e/recipe.spec.ts`, `frontend/e2e/recipes.spec.ts`: as before, through radios; axe passes on each page.
- `frontend/visual/stories.spec.ts`: compares all 27 baselines, and (added in review round 1) a `forced-colours` project in `playwright.visual.config.ts` shoots every story with `forcedColors: 'active'` against `frontend/visual/baselines/forced-colours/`, which checks criterion 12.

Commands: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm --filter frontend build-storybook && pnpm --filter frontend test:visual` (in CI).

## Decisions

- **Browse tilt as a `tilt` prop, unused by any caller yet**, because browse's quick-filter row doesn't exist until TAS-83 (Picnic page layouts), and the filter panel is a sheet or side column, not browse. Two fixed values, `left` (-1.5°) and `right` (1.5°), inside the board's 1 to 2 degrees; the caller alternates. Asked: where the browse tilt is switched on → Prop, TAS-83 uses it.
- **The "With all of these" removable chip keeps its outlined look**, because it changes how the With chips combine rather than adding a filter, and mint means chosen. It takes the off chip's field outline, hover and pressed, with a cross. Asked: how the "With all of these" chip looks → Keep it outlined.
- **Mint hover and pressed become tokens** (`--color-mint-hover`, `--color-mint-pressed`), because three components use them, one definition reaches the Dino bundle's tokens, and TAS-75 (buttons) can follow the same pattern for peach and pink. Asked: tokens or inline mixes → Tokens in picnic.css.
- **One PR, one commit per component**, because every baseline is made on a GitHub Actions runner, so three PRs would mean three screenshot rounds and three reviews of near-identical state rules. Asked: one PR or split → One PR.
- **Each radio covers its whole segment at opacity 0**, because a visually hidden radio fails the stories' 44 px target check, and covering the segment keeps the click target and the native radio for screen readers.
- **Pressing the chosen segment no longer calls `onValueChange`**, because a native radio fires no change when it's already checked. The recipe page used to reset Show original when Metric was pressed again while chosen; now only a real change does. No test relies on the old behaviour.
- **The stepper renders its own buttons instead of `IconButton`**, because its minus and plus look nothing like an icon button, `IconButton` would need every class overridden, and TAS-75 is restyling `IconButton`. The look is a map with one entry per button.
- **No extra text at a stepper limit**, because docs/design.md (States) says the count says why.
- **Chip labels may wrap**, because they come from data and must reflow at 320 px; the board's `white-space: nowrap` is dropped.
- **The filter chip's and removable chip's classes are written twice, not shared**, because `AGENTS.md` abstracts on the third use.
- **Every story is also screenshotted under forced colours**, because review round 1 found criterion 12 had no check behind it; a project over every story guards the whole class, not only these four components.
- **Design: skip**, because the controls board draws every component and state this changes.

## Blast radius

- `SegmentedControl` changes role from buttons to radios. Its two callers (`recipe-page.tsx:37`, `recipe-filter-panel.tsx:193`) keep compiling (same props), but their tests and e2e specs query buttons: re-check `recipe-page.test.tsx`, `recipes-page.test.tsx`, `e2e/recipe.spec.ts`, `e2e/recipes.spec.ts` (all listed in Step 4). The group's name and role don't change, so `filterGroup('Included ingredients')` and `getByRole('group', { name: 'Units' })` still work.
- `ServingsStepper` at its limit is `aria-disabled`, not `disabled`: anything asserting `toBeDisabled()` breaks (`recipe-page.test.tsx:408`, the only one).
- `FilterChip`'s role and name don't change: `recipes-page.test.tsx` chip queries (`aria-pressed`) and `e2e/phone-width.spec.ts:154,194` still hold. Re-check the phone-width spec, since chips grow from 1 px to 2 px borders and from Small to Label type.
- `picnic.css` gains two tokens; nothing else in it changes.
- PR #76 (TAS-78, checkbox) and TAS-75 (buttons) also edit `picnic.css` and `docs/design.md`; whichever merges second resolves a one-line conflict.

## Assumptions

- **Turning tilt off above about 150% text is TAS-83's**, because it depends on how the browse row wraps, which that page lays out; CSS can't read the reader's text size reliably inside the chip. Confirm with: Milo at spec approval.
- **The off filter chip, outlined removable chip and minus button have no fill at rest** (transparent on Ground), as the board draws, rather than today's Surface fill. Confirm with: Milo at spec approval.
- **A removable chip that's filled takes the board's `is-on` padding** (12 px before the label, 16 px after), as drawn, though its icon sits after the label. Confirm with: Milo when comparing the baselines with the board.

## Out of scope

- Tilting any chip on a page: TAS-83 (Picnic page layouts) passes `tilt` on browse.
- `Button` and `IconButton` restyles, and their peach and pink state tokens: TAS-75.
- The checkbox and checkbox row: TAS-78 (PR #76).
- Any change to filters, units, scaling or what the chips remove.
- The large-text tilt rule (see Assumptions).

## Validation criteria

- [ ] `pnpm lint` (Biome and `tsc -b`) passes.
- [ ] `pnpm test` passes, including every story's play, axe and the 44 px check.
- [ ] `pnpm test:e2e` passes, with axe on the recipe and recipe list pages.
- [ ] CI's `test:visual` passes with the 27 refreshed or new baselines, each matching `controls.dc.png`.
- [ ] CI's `test:visual` passes under forced colours too, with each chosen state's check and each control's outline in its `forced-colours/` baseline.
- [ ] By keyboard on a recipe page: Tab reaches Units once, arrow keys switch Metric and US, and Tab leaves.
- Evidence: feature: the recipe page's units, servings and Show original, and the recipe list's filter panel and active filters, on a phone and a laptop, and a walkthrough.
