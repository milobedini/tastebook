---
issue: TAS-72
status: building # draft | approved | building | done
branch: tastebook/tas-72-replace-the-styleguide-page-with-storybook
pr:
---

# Replace the styleguide page with Storybook

Linear: TAS-72

## Summary

Dino's components are shown on the `/styleguide` page today, which the factory can neither test per component nor screenshot per state. This work replaces it with Storybook: a story for each component, each variant and each state, named as the Dino boards name them, every story checked by axe and the components that respond tested through the Vitest add-on, all run in CI. The stories show today's Enamel look unchanged; TAS-73 (Picnic tokens and fonts) and TAS-74 (screenshot every story) build on them.

Evidence: chore — nothing changes for people using Tastebook; `/styleguide` was only ever on previews and local builds.
Design: skip — stories for today's Enamel components as they are; no new component, variant or visual change.

It ships in two PRs, each merging to `main` on its own:

- **Part 1 (this issue, TAS-72):** Storybook, the a11y, Vitest and pseudo-states add-ons, the CI steps, and the stories and interaction tests for the buttons and controls (Button, IconButton, FilterChip, RemovableChip, SegmentedControl, ServingsStepper, CheckboxRow).
- **Part 2 (a sub-issue filed on approval):** the stories for the fields and content components (Field, Input, SearchInput, NativeSelect, Banner, ConfirmDialog, CuisinePlate, EmptyState, Page, RecipeCard, RecipePhoto, Toaster and toast, Tag), then the removal of `/styleguide`, its flag, tests and e2e spec, with the e2e checks it held moved to the home page.

The styleguide stays until part 2, so nothing it shows is lost while part 1 is in review.

## Required reading

- `AGENTS.md`: hard constraints, Tests, Commands and Layout (part 1 edits the last two).
- `docs/design.md`, States (line 122) and Components (line 144): the five states and the component set the stories follow.
- `docs/design/dino/buttons.dc.html`, `controls.dc.html`, `fields.dc.html`, `feedback.dc.html`, `polaroids.dc.html`: the specimens and their `is-*` class names (`is-hover`, `is-pressed`, `is-focus`, `is-disabled`, `is-on`) that story names copy.
- `frontend/src/app/styleguide/control-sections.tsx` and `content-sections.tsx`: the example copy and data the stories reuse.
- `frontend/src/app/styleguide/styleguide-page.test.tsx` and `frontend/e2e/styleguide.spec.ts`: the coverage that must move into stories (part 1 and 2) or to the home page (part 2), not be lost.
- `frontend/e2e/fixtures.ts`: the axe tags and the extra `aria-dialog-name` rule the a11y add-on is configured with.
- `frontend/vitest.config.ts`, `frontend/vite.config.ts`, `frontend/tsconfig.app.json`, `.github/workflows/ci.yml:21-33`: what part 1 changes to run stories.
- `specs/lessons/biome-wants-native-landmark-elements.md`: story markup uses native landmark elements.

## Product behaviour

1. Every component exported from `frontend/src/ui/index.ts` has stories in Storybook.
2. Each component has a story per variant and per state it has today, named as the boards name it.
3. Every story passes the a11y add-on's WCAG 2.2 A and AA checks.
4. Every control in every story is at least 44 px tall.
5. Interaction tests prove the toggles, the stepper and the segmented control respond as today.
6. Stories show today's Enamel look in its dark theme, unchanged.
7. CI builds Storybook and fails when any story's test fails.
8. `/styleguide`, its route, flag, page tests and e2e spec are gone (part 2).
9. `AGENTS.md` and `docs/design.md` point at Storybook instead of `/styleguide`.

Part 1 delivers 1 to 7 and 9 for its seven components (and `AGENTS.md`); part 2 delivers them for the rest, and 8 and the `docs/design.md` line.

## Technical design

- **Approach:** Storybook 10 for React and Vite reads the project's `vite.config.ts`, so Tailwind, the `@/` alias and the `define`s apply to stories as to the app. Stories live beside their component as `frontend/src/ui/<file>.stories.tsx`. The Vitest add-on turns each story into a test in a second Vitest project that runs in Chromium through Playwright; the a11y add-on runs axe after each story renders and fails the test on any violation; a project-wide `afterEach` checks control heights. `pnpm test` runs both Vitest projects, so the existing command and CI step cover the stories.
- **API contract:** No change.
- **Blast radius:** `frontend/vitest.config.ts` changes shape (one config becomes two projects). Re-check that `pnpm test` still runs every `src/**/*.test.{ts,tsx}` in jsdom with `src/test/setup.ts`, and that the count of unit tests before and after matches. `tsconfig.app.json` gains `.storybook` in `include`, so `tsc -b` (and so `pnpm build` on Vercel) type-checks it; re-check `pnpm build` passes. No component in `src/ui/` changes.
- **Not changing:** the components' code and look, `enamel.css` (TAS-73 replaces it), the app's own light and dark themes, Lighthouse and the preview checks.

### Versions

Checked against the registry on 2026-10-29. All are `devDependencies` of `frontend`, added with `pnpm --filter frontend add -D`:

| Package | Version | Why |
| --- | --- | --- |
| `storybook` | `^10.6.5` | the CLI and core |
| `@storybook/react-vite` | `^10.6.5` | peers `vite ^8`, `react ^19` |
| `@storybook/addon-a11y` | `^10.6.5` | axe per story |
| `@storybook/addon-vitest` | `^10.6.5` | peers `vitest ^5`, `@vitest/browser ^5`, `@vitest/browser-playwright ^5` |
| `storybook-addon-pseudo-states` | `^10.6.5` | forces `:hover`, `:active`, `:focus-visible` |
| `@vitest/browser` | `^5.0.5` | matches `vitest ^5.0.5` |
| `@vitest/browser-playwright` | `^5.0.5` | peers `playwright` |
| `playwright` | `^1.64.1` | the same release as `@playwright/test`, so one Chromium download serves both |

Add no other add-on (no docs, no autodocs, no example stories). If `storybook init` or `storybook add` is used, delete anything it writes outside the files this spec names.

### Configuration (part 1)

`frontend/.storybook/main.ts` (new). Storybook and CSF require default exports here and in each stories file; that is the one exception to named exports.

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest', 'storybook-addon-pseudo-states']
};

export default config;
```

`frontend/.storybook/preview.tsx` (new): imports the fonts and `enamel.css` exactly as `src/main.tsx:7-10` does, sets the dark theme before any story, configures axe like `e2e/fixtures.ts`, and checks target size after each story.

```ts
import type { Preview } from '@storybook/react-vite';
import { expect } from 'storybook/test';

// Same tags and extra rule as e2e/fixtures.ts, so a story and a page are held to one bar.
const wcag22aaTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const preview: Preview = {
  // Stories show Enamel's dark theme only (decided with the human); the app keeps both until TAS-73.
  beforeAll: () => { document.documentElement.dataset.theme = 'dark'; },
  parameters: {
    a11y: {
      test: 'error',
      // body, not the story root, so portalled dialogs and toasts are checked too.
      context: 'body',
      options: { runOnly: { type: 'tag', values: wcag22aaTags }, rules: { 'aria-dialog-name': { enabled: true } } }
    }
  },
  afterEach: ({ canvasElement }) => {
    // returns [{ name, height }] for every visible button, a[href], input, select and [role="checkbox"] in
    // canvasElement.ownerDocument.body under 44 px; a checkbox is measured by its closest <label>.
    // Same query and rule as the 44 px test in e2e/styleguide.spec.ts:65-86.
    expect(shortControls).toEqual([]);
  }
};

export default preview;
```

The `afterEach` body is the `page.evaluate` callback from `e2e/styleguide.spec.ts:69-83`, run directly against `canvasElement.ownerDocument`.

`frontend/vitest.config.ts` (edit) becomes two projects. Both extend the merged Vite config.

```ts
test: {
  projects: [
    { extends: true, test: { name: 'unit', environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] } },
    {
      extends: true,
      plugins: [storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)) })],
      test: { name: 'storybook', browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] } }
    }
  ]
}
```

`storybookTest` comes from `@storybook/addon-vitest/vitest-plugin` and `playwright` from `@vitest/browser-playwright`. The add-on injects its own setup file with the project annotations, so there is no `.storybook/vitest.setup.ts`.

`frontend/package.json` scripts (edit): add `"storybook": "storybook dev -p 6006"` and `"build-storybook": "storybook build"`. `test` stays `vitest run` and now runs both projects.

`frontend/tsconfig.app.json` (edit): `"include": ["src", ".storybook"]`, so `.storybook/*.ts(x)` gets the app's JSX, DOM and `vite/client` types.

`.gitignore` (edit): add `storybook-static`. Biome reads `.gitignore`, so it skips the build too.

`.github/workflows/ci.yml` (edit), Frontend job: before `pnpm test`, add `- run: pnpm --filter frontend exec playwright install --with-deps chromium` (the line the e2e job uses at 124); after `pnpm build`, add `- run: pnpm --filter frontend build-storybook`.

### Stories

**Naming.** Each file's meta sets `title: 'Dino/<Component>'`, so story IDs are `dino-<component>--<story>` and TAS-74 can map them to specimens. A state story's export name ends in the board's state (`IsHover`, `IsPressed`, `IsFocus`, `IsDisabled`, `IsOn`), so its ID ends `is-hover` and so on; a variant's state prefixes the variant (`PrimaryIsHover` → `primary-is-hover`). Set no `name`: Storybook's own title-casing of the export is the display name.

**States.** The pseudo-states add-on forces `:hover`, `:active` and `:focus-visible` through `parameters.pseudo`. `frontend/src/ui/story-states.ts` (new, not exported from `index.ts`) holds the three parameter objects every stories file shares:

```ts
export const isHover = { pseudo: { hover: true } };
export const isPressed = { pseudo: { active: true } };
export const isFocus = { pseudo: { focusVisible: true } };
```

A story that forces a state on one element of several passes a selector instead (`{ pseudo: { active: ['button[aria-label="More servings"]'] } }`). `is-disabled` and `is-on` are args, not pseudo-states. Enamel has a state style only where its classes say so (the ghost button's hover, the focus outline, disabled fills, `aria-pressed`/`data-state=on` fills); a state story whose component has no style for it renders like its default, and the restyling issues fill it in.

**Stateful stories.** A controlled component's story keeps its value in React state seeded from its args, so an interaction test sees the component re-render. (`useArgs` was the first plan, but under the Vitest add-on nothing listens for its updates, so the story never re-renders.)

```tsx
render: (args) => {
  const [pressed, setPressed] = useState(args.pressed);
  return <FilterChip {...args} pressed={pressed} onPressedChange={setPressed} />;
}
```

Callbacks in `args` use `fn()` from `storybook/test`. Interaction tests are `play` functions using `expect`, `userEvent` and `within` from `storybook/test`, finding elements by role and name.

#### Part 1 stories

| File (new) | Stories | Data |
| --- | --- | --- |
| `button.stories.tsx` | `Primary`, `Secondary`, `Ghost`, `Danger`, and for each variant `<Variant>IsHover`, `<Variant>IsPressed`, `<Variant>IsFocus`, `<Variant>IsDisabled` (20) | Primary: Bookmark icon + "Save recipe"; Secondary: CalendarPlus icon + "Add to plan"; Ghost: "Cancel"; Danger: "Delete account" (icons `aria-hidden`, as `control-sections.tsx:28-36`) |
| `icon-button.stories.tsx` | `Default`, `IsHover`, `IsPressed`, `IsFocus`, `IsDisabled`, `IsOn` | Heart, label "Favourite"; `Default` is stateful on `pressed` |
| `filter-chip.stories.tsx` | `Default`, `IsHover`, `IsPressed`, `IsFocus`, `IsOn`, `IsOnIsHover`, `IsOnIsPressed` | "Under 30 min"; `Default` is stateful on `pressed` |
| `removable-chip.stories.tsx` | `Filled`, `Outline`, `IsHover`, `IsPressed`, `IsFocus` (the states on the filled look) | Filled: "Italian"; Outline: "With all of these" |
| `segmented-control.stories.tsx` | `Default`, `IsHover`, `IsPressed`, `IsFocus` | label "Units", options Metric (`metric`) and US (`us`), value `metric`; `Default` is stateful on `value`. Hover and pressed target `button[aria-pressed="false"]`, focus targets `button[aria-pressed="true"]` |
| `servings-stepper.stories.tsx` | `Default`, `Yield`, `AtMinimum`, `AtMaximum`, `IsHover`, `IsPressed`, `IsFocus` | Default: value 4, min 1, max 12; Yield: value 12, max 24, `yieldUnit` "cookies"; AtMinimum value 1; AtMaximum value 12. States target `button[aria-label="More servings"]`. `Default` and `Yield` are stateful on `value` |
| `checkbox-row.stories.tsx` | `Default`, `IsOn`, `IsHover`, `IsPressed`, `IsFocus` | children `<b className="tabular-nums">2</b> courgettes`; `IsOn` is `checked: true`; `Default` is stateful on `checked` |

#### Part 2 stories

| File (new) | Stories | Data |
| --- | --- | --- |
| `field.stories.tsx` | `WithHelp`, `WithError` | Children render an `Input` with the control props. WithHelp: "Recipe title", help "Shown on cards and at the top of the recipe.", value "Courgette and lemon orzo"; WithError: "Servings", error "Enter a number, like 4.", value "four" |
| `input.stories.tsx` | `Default`, `IsHover`, `IsFocus`, `IsDisabled`, `IsInvalid` | `aria-label` "Recipe title", `defaultValue` "Courgette and lemon orzo"; IsInvalid sets `aria-invalid` |
| `search-input.stories.tsx` | `Default`, `IsHover`, `IsFocus` | `aria-label` "Search", placeholder "Recipes, ingredients, cuisines" |
| `native-select.stories.tsx` | `Default`, `IsHover`, `IsFocus`, `IsDisabled` | `aria-label` "Cuisine", options as `control-sections.tsx:68-73` |
| `banner.stories.tsx` | `Success`, `Warning`, `Danger` | Success and Warning copy from `content-sections.tsx:71-76`; Danger: "Couldn't import that page", "Check the web address, then try again." |
| `confirm-dialog.stories.tsx` | `Default`, `Open` | Trigger, title, description and label from `content-sections.tsx:87-95`. `Open`'s `play` presses the trigger, so axe checks the open dialog |
| `cuisine-plate.stories.tsx` | `Italian`, `Indian`, `Japanese`, `Mexican`, `French`, `EverythingElse` (shape `card`), `Hero` (Japanese, shape `hero`) | slugs as `content-sections.tsx:21-28` |
| `empty-state.stories.tsx` | `Default`, `WithoutAction` | CookingPot, copy and Clear filters action from `content-sections.tsx:103-105` |
| `page.stories.tsx` | `Default` | `parameters.layout: 'fullscreen'`; an `h1` "Recipes" and a paragraph |
| `recipe-card.stories.tsx` | `Default`, `WithPhoto`, `IsHover`, `IsPressed`, `IsFocus` | First recipe of `content-sections.tsx:6-19` with its meta; a decorator wraps each story in `MemoryRouter` from `react-router`; focus targets the link |
| `recipe-photo.stories.tsx` | `CardWithoutPhoto`, `Card`, `Hero`, `HeroWithCaption`, `BrokenPhoto` | The photo is one thumbnail `{ width: 640, url: <photoUrl> }`, where `photoUrl` is a `data:image/svg+xml` URL of a 640 × 480 rectangle filled `#e2583e`, declared in the stories file; alt "Courgette and lemon orzo"; caption "Photo: A. Cook, CC BY-SA 4.0"; BrokenPhoto's url is `/missing-photo.jpg` |
| `sonner.stories.tsx` (title `Dino/Toast`) | `Default` | Renders `Toaster` and a secondary Button "Show a toast" that calls `toast('Saved to Favourites', { action: { label: 'Undo', onClick: () => undefined } })` |
| `tag.stories.tsx` | `Default` | "Vegetarian" |

### Removal (part 2)

- Delete `frontend/src/app/styleguide/` (seven files) and `frontend/e2e/styleguide.spec.ts`.
- `frontend/src/app/routes.tsx`: remove `styleguideRoutes` and its comment (lines 7-16, 21).
- `frontend/vite.config.ts`: remove `showStyleguide` and its two comment lines (12-14) and the `VITE_SHOW_STYLEGUIDE` define (17).
- `frontend/src/vite-env.d.ts`: remove `VITE_SHOW_STYLEGUIDE` (3).
- `frontend/src/test/setup.ts`: remove `delete document.documentElement.dataset.theme;`, which only reset the theme switcher.
- `frontend/e2e/home.spec.ts`: gains the two e2e checks the styleguide spec held that aren't about components, on `/`: the fonts test (`styleguide.spec.ts:8-29`, waiting for the `Tastebook` heading), and the theme test rewritten without the switcher: with `emulateMedia({ colorScheme: 'dark' })` the body's background is `rgb(13, 20, 36)`, with `'light'` it is `rgb(243, 245, 248)`.

### Docs

- Part 1, `AGENTS.md`: in Layout, the `src/ui/` line (94) ends "; each component's stories sit beside it (`*.stories.tsx`)". In Commands, add a row `Storybook | pnpm --filter frontend storybook`, and the Frontend tests row (123) reads `` `pnpm test` (runs every story in Chromium too: install it once with `pnpm --filter frontend exec playwright install chromium`) ``.
- Part 1, `docs/design.md`, Components (line 146, after its last sentence, "…drawn on the Dino boards."): "Each has stories beside it (`<file>.stories.tsx`, run with `pnpm --filter frontend storybook`): one per variant and per state, named as on the boards (`is-hover`, `is-pressed`, `is-focus`, `is-disabled`, `is-on`), and every story passes axe and its interaction tests in CI."
- Part 2, `docs/design.md:7`: "(`frontend/src/ui/enamel.css`, the `/styleguide` page)" becomes "(`frontend/src/ui/enamel.css`, shown in Storybook)".

### Steps

Part 1 (this issue):

1. **Install Storybook and its add-ons.** `frontend/package.json`, `pnpm-lock.yaml` (edit)
   Add the eight packages in Versions and the two scripts.
   Done when: `pnpm install --frozen-lockfile` passes and `pnpm --filter frontend exec storybook --version` prints 10.6.x.
2. **Configure Storybook.** `frontend/.storybook/main.ts`, `frontend/.storybook/preview.tsx`, `frontend/src/ui/story-states.ts` (new); `frontend/tsconfig.app.json`, `.gitignore` (edit)
   As in Configuration.
   Done when: `pnpm --filter frontend build-storybook` succeeds and `pnpm lint` is clean.
3. **Run stories as tests.** `frontend/vitest.config.ts` (edit)
   Two projects as above.
   Done when: `pnpm --filter frontend test` reports the `unit` project with the same test count as on `main`, and the `storybook` project runs.
4. **Write the Button stories.** `frontend/src/ui/button.stories.tsx` (new)
   Twenty stories, with no `play` guards on the forced states (see Decisions).
   Done when: all twenty pass axe and the 44 px check.
5. **Write the other control stories and their interaction tests.** The six other part 1 stories files (new)
   Done when: every case in Tests passes and no story fails axe or the 44 px check.
6. **Run Storybook in CI.** `.github/workflows/ci.yml` (edit)
   Done when: the Frontend job on the PR installs Chromium, runs the stories in `pnpm test`, builds Storybook and passes.
7. **Point the docs at Storybook.** `AGENTS.md`, `docs/design.md` (edit)
   Done when: the lines in Docs (part 1) are in place.

Part 2 (sub-issue):

1. **Write the field and content stories.** The thirteen part 2 stories files (new)
   Done when: every part 2 case in Tests passes and no story fails axe or the 44 px check.
2. **Move the e2e checks to the home page.** `frontend/e2e/home.spec.ts` (edit)
   Done when: `pnpm test:e2e` passes with the two new tests.
3. **Remove `/styleguide`.** As in Removal.
   Done when: `pnpm lint`, `pnpm test` and `pnpm build` pass, `rg -i 'styleguide|SHOW_STYLEGUIDE' frontend docs AGENTS.md` finds nothing, and `/styleguide` on a local `pnpm dev:web` shows the not-found page.
4. **Update `docs/design.md:7`.** As in Docs (part 2).
   Done when: the line names Storybook.

### Tests

Every story is a test: it fails if the story throws, if axe finds a WCAG 2.2 A or AA violation, or if a visible control is under 44 px. The `play` cases below are the ones that assert more.

Part 1:

- `frontend/src/ui/icon-button.stories.tsx`
  - `Default`, presses "Favourite", asserts: the button has `aria-pressed="true"` and its accessible name is still "Favourite".
- `frontend/src/ui/filter-chip.stories.tsx`
  - `Default`, asserts: "Under 30 min" has `aria-pressed="false"`; after a press, `"true"`; after a second press, `"false"`.
- `frontend/src/ui/removable-chip.stories.tsx`
  - `Filled`, presses the button named "Remove filter: Italian", asserts: `args.onRemove` was called once.
- `frontend/src/ui/segmented-control.stories.tsx`
  - `Default`, presses "US", asserts: in the group named "Units", "US" has `aria-pressed="true"` and "Metric" `"false"`.
  - `Default`, tabs into the control, asserts: "Metric" has focus; tabs again, asserts: "US" has focus; presses Space, asserts: "US" has `aria-pressed="true"`. This is today's behaviour, two tab stops and no arrow keys.
- `frontend/src/ui/servings-stepper.stories.tsx`
  - `Default`, presses "More servings", asserts: the text "Serves 5"; presses "Fewer servings" four times, asserts: the text "Serves 1" and "Fewer servings" is disabled.
  - `Yield`, presses "Make more", asserts: the text "Makes 13 cookies".
- `frontend/src/ui/checkbox-row.stories.tsx`
  - `Default`, asserts: the checkbox named "2 courgettes" is not checked; after a press, it is checked.

Part 2:

- `frontend/src/ui/field.stories.tsx`
  - `WithError`, asserts: the textbox "Servings" has `aria-invalid="true"` and the accessible description "Enter a number, like 4.".
  - `WithHelp`, asserts: the textbox "Recipe title" has the accessible description "Shown on cards and at the top of the recipe." and no `aria-invalid`.
- `frontend/src/ui/confirm-dialog.stories.tsx`
  - `Open`, asserts: the alertdialog "Delete your account?" is visible; presses Cancel, asserts: no alertdialog and the "Delete account" trigger has focus.
- `frontend/src/ui/recipe-card.stories.tsx`
  - `Default`, asserts: the link "Courgette and lemon orzo" has `href="/recipes/courgette-and-lemon-orzo"`.
- `frontend/src/ui/recipe-photo.stories.tsx`
  - `Card`, asserts: the canvas has an `img` whose `src` is the stories file's `photoUrl`.
  - `BrokenPhoto`, asserts: once the image has failed, the canvas has no `img`.
- `frontend/src/ui/sonner.stories.tsx`
  - `Default`, presses "Show a toast", asserts: the text "Saved to Favourites" and a button "Undo".
- `frontend/e2e/home.spec.ts`
  - fonts, asserts: loaded families include "Bricolage Grotesque Variable" and "Atkinson Hyperlegible", and no request went to `fonts.googleapis.com` or `fonts.gstatic.com`.
  - theme, asserts: body `background-color` `rgb(13, 20, 36)` with the dark colour scheme and `rgb(243, 245, 248)` with light (one loop over both).

## Decisions

- Two PRs: Storybook, CI and the buttons and controls first; the fields and content and the removal of `/styleguide` second, because one PR would be about 35 files, and keeping the styleguide until every component has a story means nothing is unshown in between. Asked: ship as two PRs? → Two PRs.
- The segmented control's stories test what it does today (two toggle buttons, two tab stops, Space or Enter to choose), because changing its keyboard model is a behaviour change that belongs with the Picnic segmented control (native radios, arrow keys, `docs/design.md` Components). Asked: add arrow keys or test today's? → Test what it does today.
- The styleguide's colour, type and space sections are dropped, not moved, because TAS-73 replaces those tokens and the Dino foundations board documents them. Asked: drop or move to Storybook? → Drop them.
- Stories show Enamel's dark theme only, set once in the preview's `beforeAll`, because Picnic is dark only and TAS-74 compares stories with dark boards; the app itself keeps both themes until TAS-73. Asked: which theme? → Dark only.
- Storybook is built and tested in CI only, not published to previews or as an artifact, because nothing reads it outside CI yet and TAS-74 runs in CI too. Asked: where should it be available? → CI only.
- The Button stories have no style guards on their forced states, because the pseudo-states add-on only rewrites stylesheets when the Storybook UI renders a story, so under the Vitest add-on a forced state renders like its default (checked: in a built Storybook, `ghost-is-hover` and `primary-is-focus` render the hover fill and focus outline). The states are proved by eye in Storybook now and by TAS-74's screenshots later. Asked: how to prove the state stories under Vitest? → Drop the two style guards.
- States are forced with `storybook-addon-pseudo-states` rather than with `play` functions that hover or focus, because a forced state holds still in the Storybook UI and in a screenshot, and pressed (`:active`) can't be held any other way.
- The 44 px check moves into the preview's `afterEach`, so every story is held to it without each file repeating it; the axe tags and `aria-dialog-name` rule are copied from `e2e/fixtures.ts` (two uses, so no shared module yet, per `AGENTS.md`).
- Story tests run inside `pnpm test` as a second Vitest project, rather than a separate command, so the existing command and CI step stay the one way to run the frontend's tests.
- Story files sit beside their component in `src/ui/`, not in a `stories/` folder, as `AGENTS.md` places tests beside their file.
- The fonts and theme checks from `e2e/styleguide.spec.ts` move to the home page, because they test the app's CSS and bundle, not a component; the axe and 44 px checks become per-story checks.

## Assumptions

- Storybook 10.6's add-ons work with this repo's Vite 8 and Vitest 5 as their peer ranges say (checked in the registry, not yet run). Confirm with: the implement stage, at step 3.
- The pseudo-states add-on forces states in Tailwind 4's output in the Storybook UI. Checked by the implement stage in a built Storybook; under the Vitest add-on it doesn't, so story tests run forced-state stories in their default look.
- Adding Chromium to the Frontend job adds about a minute to CI, which is acceptable. Confirm with: Milo, at approval.

## Out of scope

- Any change to a component's code or look, including arrow keys for the segmented control and the loading state no Enamel component has yet.
- New stories for components the boards draw but the code lacks (Note, Sheet, Combobox, Error with retry, Dock).
- Picnic's tokens and fonts (TAS-73) and screenshotting stories against the boards (TAS-74).
- Publishing Storybook to previews or as a CI artifact.
- `enamel.css`'s `@theme static` and its comment about the style guide, which TAS-73 rewrites.
- Storybook's docs pages, autodocs and a themed manager UI.

## Validation criteria

- [ ] `pnpm lint` (Biome and `tsc -b`) is clean.
- [ ] `pnpm test` passes both the `unit` and the `storybook` projects.
- [ ] `pnpm --filter frontend build-storybook` and `pnpm build` succeed.
- [ ] Part 2: `pnpm test:e2e` passes, and `/styleguide` shows the not-found page.
- [ ] CI's Frontend job runs the stories and builds Storybook.
- Evidence: chore: "No visible change." with the checks line, plus the count of stories the `storybook` project ran.
