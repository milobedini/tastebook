---
issue: TAS-75
status: draft # draft | approved | building | done
branch: tastebook/tas-75-restyle-buttons-and-icon-buttons-in-picnic
pr:
---

# Restyle buttons and icon buttons in Picnic

Linear: TAS-75

## Summary

`Button` and `IconButton` in `frontend/src/dino/` still have their pre-Picnic shape: one size, hover only on ghost, no pressed or loading state, and a native `disabled` that can't take focus or say why. This work restyles both to the Dino boards (`docs/design/dino/buttons.dc.html`, the icon buttons in `controls.dc.html`), adds a large size to each, a loading state and a disabled reason to `Button`, and the filled icon to an `IconButton` toggle that's on. Every button in the app takes the new look, and the stories and their baselines are updated to match the boards.

Evidence: feature — every button and icon button people see in Tastebook changes look.
Design: skip — the buttons and controls boards already draw every variant, size and state this builds; build to the boards.
Components: Button (changed: large size, loading state, disabled reason), IconButton (changed: large size, filled icon when on).

## Required reading

- `AGENTS.md`: hard constraints, Tests, and the `dino` label rule in Standards.
- `docs/design.md`: Colour, Type, Space and shape (Shadows, Motion), States, Components (Button and Icon button rows), Rules. Where a board and this file disagree, this file wins.
- `docs/design/dino/buttons.dc.html` (styles at lines 15-42) and `docs/design/dino/controls.dc.html` (`.ib` styles at lines 17 and 24-32, markup at lines 65-74): the values to build to. Their PNGs are beside them.
- `frontend/src/dino/button.tsx`, `frontend/src/dino/icon-button.tsx`: the components this rewrites.
- `frontend/src/dino/story-states.ts`: the `isHover`, `isPressed` and `isFocus` parameters every state story uses.
- `frontend/.storybook/preview.tsx`: the 44 px target check this work changes.
- `frontend/visual/stories.spec.ts` and `frontend/playwright.visual.config.ts`: how baselines are shot (reduced motion, play runs first, focus blurred).
- `specs/lessons/storybook-under-vitest-has-no-manager.md`: under `pnpm test` pseudo-states aren't forced, so no play asserts a hover or pressed style.
- `specs/lessons/story-play-leaves-real-focus.md`: a story's screenshot is taken after its play function.
- The **Spec brief** comment on TAS-75: the caller list and the 44 px check snag, already checked.

## Product behaviour

1. Button's primary, secondary, ghost and danger variants look as the buttons board draws them.
2. A Button is 44 px tall, and 64 px tall with `size="large"`.
3. Each Button variant shows hover, pressed and focus as drawn; the primary sinks 3 px.
4. A disabled Button stays focusable, ignores presses and shows and reads out its reason.
5. A loading Button keeps its size, shows a spinner and its "-ing" label, and ignores presses.
6. With reduced motion, the loading spinner doesn't turn.
7. An IconButton is a 44 px circle on Surface, and 48 px with `size="large"`.
8. An IconButton toggle that's on fills pink and fills its icon.
9. IconButton shows hover, pressed, focus and disabled; disabled stays focusable and ignores presses.
10. Every variant and state has a story, and its committed baseline matches its board.
11. Under forced colours, pastel buttons keep a 2 px outline and icons take the system colour.

## Technical design

- **Approach:**
  - **Tokens.** The boards mix their hover and pressed colours with `color-mix()` and use a sunk shadow and a 19 px label that Picnic has no token for. Each becomes a token in `frontend/src/dino/picnic.css` and a row in `docs/design.md`, so components never carry a literal value (`AGENTS.md`, Frontend; `docs/design.md`, Rules › Colour, "Tokens only").
  - **Button** (`frontend/src/dino/button.tsx:7-30`) keeps `cva`, gains a `size` variant (`default`, `large`), and moves its disabled look from `disabled:` to `aria-disabled:`. Hover and pressed classes are guarded with `not-aria-disabled:`, so a disabled or loading button doesn't react. It renders its own reason line after itself while disabled, linked by `aria-describedby`. `asChild` (a link styled as a button) gets a separate early return and can't be disabled or loading, enforced by the props type.
  - **Loading.** When `loadingLabel` is passed, the button's content is a one-cell grid holding two layers: the caller's children and a spinner with the label. Both are always rendered; the inactive one is `invisible` and `aria-hidden`, so the button is always as wide as the wider layer and never changes size when loading starts or stops. The accessible name is the visible layer's text.
  - **IconButton** (`frontend/src/dino/icon-button.tsx:13-27`) moves its classes into a `cva` with the same `size` variant, takes the board's 2 px transparent border, hover, pressed and on-hover states, renders `disabled` as `aria-disabled`, and fills its icon when `pressed` is true.
  - **Ignoring presses.** Both components wrap `onClick`: while `aria-disabled` is set they call `event.preventDefault()` and don't call the caller's handler. `preventDefault` also stops a disabled `type="submit"` button submitting its form, including by Enter in a field. The same six lines live in both files; this is their second use, so they stay duplicated (`AGENTS.md`, rule of three).
  - **The 44 px check.** `frontend/.storybook/preview.tsx:36` measures `getBoundingClientRect().height`, which includes transforms. A pressed secondary button at `scale(0.97)` measures 42.7 px and a pressed icon button at `scale(0.94)` 41.4 px, so the check would fail in the visual run, where pressed is forced, and the baseline would be Storybook's error page. It switches to `offsetHeight`, the layout height before transforms. That's what a target's size means for WCAG 2.5.8: the press shrink lasts only while the pointer is down.
- **API contract:** No change.
- **Blast radius:** see [Blast radius](#blast-radius).
- **Not changing:** see [Out of scope](#out-of-scope).

### Button props

```ts
// A disabled button must say why (docs/design.md, States › Disabled), so the reason is required with it.
type DisabledProps =
  | { disabled?: undefined; disabledReason?: undefined }
  | { disabled: boolean; disabledReason: string };

// A loading button shows its "-ing" label ("Saving…"), so the label is required with it.
type LoadingProps =
  | { loading?: undefined; loadingLabel?: undefined }
  | { loading: boolean; loadingLabel: string };

type ButtonBaseProps = Omit<ComponentProps<'button'>, 'disabled'> & VariantProps<typeof buttonVariants>;

// asChild renders a link styled as a button; a link can't be disabled or loading.
type ButtonProps = ButtonBaseProps &
  (
    | ({ asChild?: false } & DisabledProps & LoadingProps)
    | { asChild: true; disabled?: undefined; disabledReason?: undefined; loading?: undefined; loadingLabel?: undefined }
  );
```

Rendering, for the `<button>` path:

- `aria-disabled="true"` when `disabled` or `loading` is true; otherwise no attribute.
- `aria-busy="true"` when `loading` is true; otherwise no attribute.
- `aria-describedby`: the caller's value, plus the reason line's id (from `useId()`) while the reason shows, joined with a space; no attribute when both are empty.
- The reason line shows when `disabled` is true and `loading` isn't. Loading wins when both are true.
- The component returns a fragment: the `<button>`, then the reason line. The fragment is returned on every render, so the button keeps its DOM node and its focus when `disabled` changes. The reason line is a block `<p>`, so it sits under the button in normal flow and in a column; a caller that puts a disabled Button in a flex row puts it in a column wrapper itself.

```tsx
<p id={reasonId} className="flex items-start gap-2 text-small text-muted">
  <Info aria-hidden="true" className="mt-px size-4 shrink-0" />
  {disabledReason}
</p>
```

Content when `loadingLabel` is passed (otherwise `children` as today):

```tsx
<span className="grid">
  <span aria-hidden={loading || undefined} className={cn(layer, loading && 'invisible')}>{children}</span>
  <span aria-hidden={!loading || undefined} className={cn(layer, !loading && 'invisible')}>
    <Spinner />
    {loadingLabel}
  </span>
</span>
// layer = 'col-start-1 row-start-1 inline-flex items-center justify-center gap-2'
```

`Spinner` is a component private to `button.tsx`, drawn as on the board: a 25% opacity track and a quarter arc, both in `currentColor`. `motion-reduce:animate-none` is required: the global reduced-motion rule in `picnic.css` only shortens an animation to 0.01 ms, and an infinite spin that short would flicker rather than stop.

```tsx
const Spinner = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="animate-spin motion-reduce:animate-none">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
```

### Button classes

The board's values, as classes on Picnic's tokens. `transition` covers colour, border, shadow and transform at the 120 ms default in `picnic.css`. Tailwind 4's `hover:` applies only on devices that hover, as `docs/design.md` States asks.

```ts
const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-pill border-2 border-transparent no-underline transition aria-disabled:cursor-not-allowed aria-busy:cursor-progress aria-disabled:not-aria-busy:border-dashed aria-disabled:not-aria-busy:border-field aria-disabled:not-aria-busy:bg-surface aria-disabled:not-aria-busy:text-muted aria-disabled:not-aria-busy:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-peach text-on-pastel shadow-press not-aria-disabled:hover:bg-peach-hover not-aria-disabled:active:translate-y-0.75 not-aria-disabled:active:bg-peach-pressed not-aria-disabled:active:shadow-press-sunk',
        secondary:
          'border-field bg-transparent text-ink not-aria-disabled:hover:border-ink not-aria-disabled:hover:bg-surface not-aria-disabled:active:scale-97 not-aria-disabled:active:border-ink not-aria-disabled:active:bg-line',
        ghost:
          'bg-transparent text-ink not-aria-disabled:hover:bg-surface not-aria-disabled:active:scale-97 not-aria-disabled:active:bg-line',
        danger:
          'bg-danger text-on-danger not-aria-disabled:hover:bg-danger-hover not-aria-disabled:active:scale-97 not-aria-disabled:active:bg-danger-pressed'
      },
      size: {
        default: 'h-11 px-5 text-label',
        large: 'h-16 px-7 text-label-l'
      }
    },
    defaultVariants: { variant: 'primary', size: 'default' }
  }
);
```

The focus ring is the global `:focus-visible` rule in `picnic.css` (3 px Ink, offset 0), which already matches the board; Button adds nothing for it.

### IconButton

```ts
type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
} & VariantProps<typeof iconButtonVariants> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'aria-pressed' | 'disabled'>;

const iconButtonVariants = cva(
  'inline-grid shrink-0 cursor-pointer place-items-center rounded-pill border-2 border-transparent bg-surface text-ink transition not-aria-disabled:hover:bg-line not-aria-disabled:active:scale-94 not-aria-disabled:active:bg-surface-pressed aria-pressed:bg-pink aria-pressed:text-on-pastel not-aria-disabled:aria-pressed:hover:bg-pink-hover not-aria-disabled:aria-pressed:active:bg-pink-pressed aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:border-field aria-disabled:bg-surface aria-disabled:text-muted',
  {
    variants: { size: { default: 'size-11', large: 'size-12' } },
    defaultVariants: { size: 'default' }
  }
);
```

The icon renders as `<Icon aria-hidden="true" strokeWidth={pressed ? 2 : 2.5} className={cn('size-5', pressed && 'fill-current')} />`, as the board draws it (`controls.dc.html:67-73`). `aria-disabled="true"` when `disabled` is true; otherwise no attribute. The existing `label` → `aria-label` and `pressed` → `aria-pressed` stay.

### Tokens

Added to `@theme static` in `frontend/src/dino/picnic.css`, each beside its base token, and as rows in `docs/design.md`:

```css
--color-surface-pressed: color-mix(in oklab, var(--color-surface) 70%, var(--color-field));
--color-peach-hover: color-mix(in oklab, var(--color-peach) 80%, var(--color-ink));
--color-peach-pressed: color-mix(in oklab, var(--color-peach) 86%, var(--color-on-pastel));
--color-pink-hover: color-mix(in oklab, var(--color-pink) 80%, var(--color-ink));
--color-pink-pressed: color-mix(in oklab, var(--color-pink) 86%, var(--color-on-pastel));
--color-danger-hover: color-mix(in oklab, var(--color-danger) 80%, var(--color-ink));
--color-danger-pressed: color-mix(in oklab, var(--color-danger) 86%, var(--color-on-pastel));

--text-label-l: 1.1875rem;
--text-label-l--line-height: 1.5rem;
--text-label-l--font-weight: 800;

--shadow-press-sunk: 0 2px 0 var(--color-on-pastel);
```

`frontend/src/dino/cn.ts` adds `label-l` to `text` and `press-sunk` to `shadow`, so `tailwind-merge` doesn't drop them next to a colour or another shadow.

### Steps

1. **Add the tokens.** `frontend/src/dino/picnic.css`, `frontend/src/dino/cn.ts`, `docs/design.md` (edit)
   Add the tokens above. In `docs/design.md`: add a Colour table row for each colour token, directly under its base token, Use "A peach control under the pointer", "A peach control while pressed", and the same for pink and danger, and "An icon button while pressed" for `--color-surface-pressed`, with an empty Contrast cell; add a Type row `Label L (large buttons) | Nunito | 19 / 24 px | 800` under Label; in Space and shape › Shadows, after "the shadow shrinks to match", add "(the sunk shadow, `0 2px 0` in On pastel)".
   Done when: `pnpm lint` passes and the built CSS (`pnpm --filter frontend build`) contains `--color-peach-hover` and `--shadow-press-sunk`.

2. **Measure targets before transforms.** `frontend/.storybook/preview.tsx` (edit)
   Replace `target.getBoundingClientRect().height` with `target.offsetHeight`. Add a one-line comment: the layout height, so a pressed control's shrink doesn't count.
   Done when: `pnpm test` passes.

3. **Restyle Button.** `frontend/src/dino/button.tsx` (edit)
   Build the props, classes, click guard, reason line, loading layers and `Spinner` above. `asChild` returns `<Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props} />` first; the `<button>` path follows.
   Done when: `pnpm lint` passes, and `<Button disabled>` without `disabledReason` and `<Button asChild loading …>` fail to type-check (try each once, then remove).

4. **Write the Button stories.** `frontend/src/dino/button.stories.tsx` (edit)
   Keep the existing stories and names. Every `*IsDisabled` story passes `disabled: true` and `disabledReason: 'Tick at least one thing to add.'`. Add `PrimaryIsLoading`, `SecondaryIsLoading`, `DangerIsLoading`, `Large` and `LargeIsDisabled`, with the args and plays in [Tests](#tests). Ghost gets no loading story: the board marks it "Not used". Copy: primary "Save recipe" / "Saving…", secondary "Add to plan" / "Adding…", danger "Delete account" / "Deleting…", large "Next step", large disabled "Add 0 things".
   Done when: `pnpm test` passes and Storybook shows each story as on `buttons.dc.png`.

5. **Restyle IconButton and write its stories.** `frontend/src/dino/icon-button.tsx`, `frontend/src/dino/icon-button.stories.tsx` (edit)
   Build the IconButton above. Keep the existing stories; add `IsOnIsHover` (`pressed: true` with `isHover`), `IsOnIsPressed` (`pressed: true` with `isPressed`) and `Large`, with the plays in [Tests](#tests).
   Done when: `pnpm test` passes and Storybook shows each story as on `controls.dc.png`'s icon button row.

6. **Move callers' tests to `aria-disabled`.** `frontend/src/dino/servings-stepper.stories.tsx`, `frontend/src/recipes/recipe-page.test.tsx` (edit)
   Replace `toBeDisabled()` with `toHaveAttribute('aria-disabled', 'true')`, and add the extra press in [Tests](#tests). `servings-stepper.tsx` itself doesn't change.
   Done when: `pnpm test` passes.

7. **Update the baselines.** `frontend/visual/baselines/` (edit)
   Run `pnpm --filter frontend test:visual:update` on the implement runner (a GitHub Actions Linux runner) and commit every changed and new PNG. Expect changes to `dino-button--*`, `dino-iconbutton--*`, `dino-confirmdialog--*`, `dino-emptystate--*` and `dino-servingsstepper--*`, and new `dino-button--primary-is-loading`, `--secondary-is-loading`, `--danger-is-loading`, `--large`, `--large-is-disabled`, `dino-iconbutton--is-on-is-hover`, `--is-on-is-pressed` and `--large`. Compare each Button and IconButton shot with its board before committing.
   Done when: `pnpm --filter frontend test:visual` passes and no shot is an error page.

### Tests

- `frontend/src/dino/button.stories.tsx`
  - `Primary` play: click "Save recipe", asserts: `args.onClick` called once, and the existing colour check holds (`rgb(255, 179, 138)` on `rgb(42, 20, 64)`).
  - `PrimaryIsDisabled` play: focus the button, asserts: it has focus, `aria-disabled="true"`, accessible description "Tick at least one thing to add."; click it, asserts: `args.onClick` not called.
  - `PrimaryIsLoading` (renders a stateful button seeded idle; its `onClick` calls `args.onClick` and sets `loading` true; `loadingLabel: 'Saving…'`) play: read the "Save recipe" button's `offsetWidth`, click it, asserts: the button is named "Saving…", has `aria-busy="true"`, and its `offsetWidth` equals the one read before; click it again, asserts: `args.onClick` called exactly once. Its screenshot shows the loading state.
  - `SecondaryIsLoading`, `DangerIsLoading`: args `loading: true` and their label; play asserts: the button named "Adding…" / "Deleting…" has `aria-busy="true"`. Both use one play built by `const playIsLoading = (name: string): Story['play'] => …`.
  - `Large` (primary, `size: 'large'`) play, asserts: the "Next step" button's `offsetHeight` is 64.
  - `LargeIsDisabled` (primary, large, disabled with the reason) play, asserts: accessible description "Tick at least one thing to add." and the text is visible under the button.
- `frontend/src/dino/icon-button.stories.tsx`
  - `Default` play (existing): click "Favourite", asserts: `aria-pressed="true"`; add: the icon's `fill` computes to `rgb(42, 20, 64)` (On pastel), where it was `none` before the click.
  - `IsDisabled` play: focus "Favourite", asserts: it has focus and `aria-disabled="true"`; click it, asserts: `args.onClick` not called.
  - `Large` play, asserts: the "Favourite" button's `offsetHeight` and `offsetWidth` are both 48.
- `frontend/src/dino/servings-stepper.stories.tsx`
  - `Default` play: after the four presses to "Serves 1", asserts: "Fewer servings" has `aria-disabled="true"`; press it once more, asserts: the text still reads "Serves 1".
- `frontend/src/recipes/recipe-page.test.tsx`
  - "scales the amounts…" (line 408): asserts: "Fewer servings" has `aria-disabled="true"` instead of `toBeDisabled()`.
- `frontend/visual/stories.spec.ts` (unchanged): every Button and IconButton story's shot matches its new baseline. The loading shots are taken with reduced motion, so the spinner is still.

Not automated: the spinner stopping under reduced motion has no assertion beyond the still baseline (Playwright cancels running animations for a shot either way); review checks `motion-reduce:animate-none`. Forced colours are checked by review against `docs/design/dino/forced-colours.dc.html`: the 2 px borders are in the classes and every icon uses `currentColor`.

## Decisions

- Button renders its disabled reason from a `disabledReason` prop, linked by `aria-describedby`, and the type requires it with `disabled`, because every disabled control must say why and a type is the cheapest guard against forgetting. Asked: should Button render the disabled reason itself? → Button renders it.
- The hover and pressed colours, the sunk shadow and the 19 px label become named tokens, each listed in `docs/design.md`, because components may use tokens only. Asked: tokens or inline values? → Tokens, listed in the doc.
- The primary's 2 px border is transparent, not On pastel as the board draws it, because `docs/design.md` (Colour; Rules › Shape) says transparent and the doc wins over a board. Asked: transparent or On pastel? → Transparent, as the doc.
- A disabled IconButton has a Surface fill, not the board's transparent one, because `docs/design.md` States › Disabled says Surface and the doc wins.
- An IconButton toggle that's on darkens 14% towards On pastel when pressed (`--color-pink-pressed`), which the board doesn't draw, because `docs/design.md` States › Pressed applies it to every pastel fill.
- `size` is `'default' | 'large'` on both components, because `docs/design.md` names the size "large" and both have exactly two.
- Both loading layers always render, the inactive one invisible, because that's the only way the width can't change when loading starts or ends with a longer or shorter label.
- `asChild` can't be disabled or loading, because Radix's `Slot` runs the child link's click handler before Button's, so a disabled link would still navigate.
- The spinner uses Tailwind's `animate-spin` (1 s a turn), not the board's 900 ms, because no token holds a spin speed and the doc sets none.
- The 44 px check measures `offsetHeight`, because the press shrink is momentary and would otherwise turn every pressed baseline into an error page.

## Assumptions

- IconButton takes no disabled reason: the controls board draws none, and its one caller, the servings stepper, needs none because its count says why (`docs/design.md`, States › Disabled). Confirm with: Milo, at spec approval.
- IconButton has no loading state: neither board draws one and no caller waits on a press yet. Confirm with: Milo, at spec approval.
- Pink is the only on colour; IconButton takes no colour prop until a second toggle needs one. Confirm with: Milo, at spec approval.
- The work fits one PR (about 12 files plus baselines), so it isn't split. Confirm with: Milo, at spec approval.

## Blast radius

- **Button's look** changes for every caller: `app/not-found-page.tsx:10`, `app/home-page.tsx:14,70`, `recipes/recipe-filter-panel.tsx:43`, `recipes/recipes-page.tsx:57,110,205,220`, `recipes/recipe-page.tsx:111,148,151`, `recipes/active-filters.tsx:111`, `dino/confirm-dialog.tsx:23,26`. None passes `disabled`, so the props type breaks none of them; Label type (15/20, 800) replaces Body (16/24, 600), so a label gets slightly narrower. Re-check: `pnpm lint` (types), and the confirm dialog and empty state baselines.
- **`asChild`** callers (`not-found-page`, `home-page`, `recipes-page:220`, `recipe-page:148,151`) and Radix's `AlertDialog.Action`/`Cancel asChild` in `confirm-dialog.tsx`: the `asChild` path keeps passing every prop through `Slot`, and Button still receives `ref` as a prop. Re-check: `pnpm test:e2e` and the ConfirmDialog story's play.
- **IconButton** has one caller, `dino/servings-stepper.tsx:26,36`, which passes `disabled` and `className="border-0 bg-line"`. Its buttons stay focusable at a limit now, and the stepper's look shifts a little; TAS-76 (Restyle the stepper) restyles it. Re-check: the servings stepper stories and `recipe-page.test.tsx`.
- **The 44 px check** in `.storybook/preview.tsx` runs after every story. `offsetHeight` is defined on every `HTMLElement`, including the checkbox's `<label>`. Re-check: `pnpm test`.
- **`cn.ts`** is used by every Dino component; adding two names only teaches `tailwind-merge` new values.

## Out of scope

- The servings stepper's own restyle (mint plus, outlined minus): TAS-76.
- Filter chips, the segmented control and their mint hover and pressed tokens (`--color-mint-hover`, `--color-mint-pressed`): their own Dino issues.
- Moving any caller to the large size, or adding a disabled or loading button to a page: the pages that need them come with their features.
- A disabled IconButton toggle that's on: no caller and no board draws it.
- Icon stroke widths inside Button: callers' icons keep Lucide's default.

## Validation criteria

- [ ] `pnpm lint` passes (Biome and `tsc`).
- [ ] `pnpm test` passes (Vitest, and every story's play, axe check and 44 px check in Chromium).
- [ ] `pnpm --filter frontend build-storybook && pnpm --filter frontend test:visual` passes with the updated baselines.
- [ ] `pnpm test:e2e` passes.
- [ ] Each Button and IconButton baseline matches its board image (`frontend/src/dino/boards.ts`) when compared side by side.
- Evidence: feature — the verify stage records the Button and IconButton stories and a page with buttons (the recipe page, with the servings stepper at its limit).
