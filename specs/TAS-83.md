---
issue: TAS-83
status: building # draft | approved | building | done
branch: tastebook/tas-83-lay-out-the-home-recipe-list-and-recipe-pages-as-on-the
pr: 92
---

# Lay out the home, recipe list and recipe pages as on the Picnic boards

Linear: TAS-83

## Summary

Every page is still a single 672 px column with no top bar. Dino has moved, so this work lays the pages out as drawn on the Picnic boards. There's a shared shell: a top bar with the wordmark and recipe search, 20 and 32 px gutters, and content up to 1200 px wide. The recipe list gets its Display XL title with a squiggle, a grid of 2, 3 or 4 polaroids a row, and filters in a column on a laptop or in a sheet below that. The recipe page gets a taped photo, the time blobs, ingredients with dotted leaders, the numbered method and two columns on a laptop. Home becomes a thin landing.

It ships in three parts, each merging to `main` on its own and in order:

1. **Part 1 (this issue, TAS-83): the shell.** The top bar and its search, the 1200 px page, home and not found, and the Squiggle.
2. **Part 2: the recipe list.** The title, the grid, the filter column and the filters sheet.
3. **Part 3: the recipe page.** Tape, TimeBlobs, AmountList, Method and the two columns.

Evidence: feature: every page's layout changes on screen.
Design: skip. `docs/design/picnic/browse-and-recipe.dc.html` and `docs/design/dino/layout.dc.html` draw every new piece: the top bar, squiggle, blobs, leaders, tape, method, filter column and the recipe's two columns. `docs/design.md` (Layout, The fun, rationed, Components) gives the rules. Build to the boards.
Components: TopBar (new), Squiggle (new), TimeBlobs (new), AmountList (new), Method (new), Polaroid (changed: tape), Page (changed: 1200 px width and Picnic's gutters).

## Required reading

- `AGENTS.md`: the hard constraints, Tests, the rule of three, the area dependency rules, and the `dino` label in Standards.
- `docs/design.md`: Type, Space and shape (gutters, photos), Layout, States, The fun, rationed, Components (Icon button, Field, Filter chip, Sheet, Method), Rules. Where a board and this file disagree, this file wins.
- `docs/design/dino/layout.dc.html` and `layout.dc.png`: the top bar (`.top`, `.search`), the list's 260 px column and 4-a-row grid, the recipe's 5 to 7 columns, `.blob`, `.ing`, `.steps` and `.tape`. This spec quotes its values.
- `docs/design/picnic/browse-and-recipe.dc.html` and `.png`: the phone list and the phone recipe, the squiggle paths and the blob shapes.
- `frontend/src/dino/page.tsx`: the shell this replaces. Keep its safe-area insets.
- `frontend/src/dino/empty-state.tsx`: the Doodle, the shape to mirror for an `aria-hidden` SVG drawn in `currentColor`.
- `frontend/src/dino/sticker.tsx` and `polaroid.tsx`: Dino component shape, `Lean`, and `large-text:` straightening.
- `frontend/src/dino/sheet.tsx`: the controlled `open` and `onOpenChange` the filters sheet uses.
- `frontend/src/recipes/recipes-page.tsx`: the search, filters and focus handling that move.
- `frontend/src/recipes/recipe-page.tsx`, `recipe-facts.tsx`, `recipe-ingredients.tsx` and `recipe-method.tsx`: what part 3 rearranges.
- `specs/lessons/design-doc-wins-over-a-board.md`: each board and doc difference is listed under Decisions.
- `specs/lessons/biome-wants-native-landmark-elements.md`: use `<search>`, `<header>`, `<aside>` and `<main>`, not roles.
- `specs/lessons/factory-runs-make-baselines-in-place.md`, `story-play-leaves-real-focus.md`, `pressed-scale-and-the-44px-story-check.md` and `storybook-under-vitest-has-no-manager.md`: how the stories and baselines are made.
- `specs/lessons/wikimedia-photos-load-anonymously.md` and `vercel-preview-checks.md`: the preview checks must pass on each part's own PR.

## Product behaviour

**Part 1: the shell (this issue)**

1. Every page shows a top bar with the Tastebook wordmark linking home.
2. On a laptop, the top bar holds a 360 px "Search recipes" field.
3. Below 1024 px, a search icon button opens the field under the bar.
4. Typing a search on any page shows the recipe list's results.
5. Page content has 20 px gutters on phones, 32 px from 640 px, and is at most 1200 px wide.
6. Home shows the wordmark heading with its squiggle, Browse recipes and the API status.
7. Not found shows "Page not found" and Back to Tastebook under the top bar.
8. Under forced colours, home and not found pass axe, and the squiggle follows the text colour.

**Part 2: the recipe list**

9. The list's title is "What shall we cook tonight?", with a squiggle under the italic "cook".
10. Polaroids sit 2 a row on phones, 3 on tablets and 4 on laptops, tilting in alternate directions.
11. On a laptop, the filters sit in a 260 px column beside the list, their chips tilted.
12. Below 1024 px, "Filters · 2" opens the filters in a sheet with "Show 24 recipes" at its foot.
13. Under forced colours, the list passes axe and chosen filter chips keep a visible border.

**Part 3: the recipe page**

14. The photo is a taped polaroid at 7:5 with its credit and at most two stickers.
15. The recipe's name is in Display XL, with a squiggle under its longest word.
16. Prep, cook and any extra time show in three blobs: peach, butter and mint.
17. Under the description, one muted line reads like "45 min · Easy · One-pot · Indian · Main".
18. Each ingredient is joined to its amount by a dotted leader.
19. The method's step numbers are in the serif italic in Pop, with hairlines between steps.
20. On a laptop, the photo and ingredients form the left column and the ingredients stay in view.
21. Below 1024 px, the page is one column: photo, title, blobs, servings, ingredients, method.
22. There's no "Let's get cooking" button.
23. Under forced colours, the recipe passes axe and the blobs and leaders stay drawn.

## Technical design

- **Approach:** the shell moves into a layout route in `app/`. That route renders Dino's new `TopBar` and an `<Outlet />`. Each page keeps rendering Dino's `Page`, which becomes the 1200 px main column. The top bar's search writes the recipe list's address. `recipes` owns it through a `useRecipeSearch` hook, which `app/` composes with `TopBar`, since `app` may depend on `recipes` and Dino depends on no area. Part 2 rebuilds the list's layout and part 3 the recipe's layout, each from new Dino pieces.
- **API contract:** no change.
- **Blast radius:**
  - `Page` (`frontend/src/dino/page.tsx`) is used by all four pages. Part 1 changes its width and gutters, so re-check the list and the recipe at 375 px (`e2e/phone-width.spec.ts`) and the Page baseline.
  - `routes` (`frontend/src/app/routes.tsx`) is also what `src/test/render-route.tsx` renders. Every page test then gets the top bar, so a test that finds the only `link` or the only `searchbox` must still find one. Only the list had a search box, and its tests keep finding it by name.
  - `RecipePhoto`'s `sizes` (part 2 for `card`, part 3 for `hero`) changes which thumbnail loads. Re-check the "loads the first row's photos…" test, which asserts `sizes`.
  - `Polaroid` gains an optional prop, so the list's cards don't change.
  - `FilterChip`'s existing `tilt` prop gets its first caller.
- **Not changing:** see Out of scope.

### The shell (part 1)

```diff
 frontend/src/
   app/
+    app-layout.tsx          TopBar + <Outlet />, the one parent route
     routes.tsx              wraps every route in AppLayout
     home-page.tsx           thin landing
     not-found-page.tsx      unchanged markup under the new shell
   dino/
+    top-bar.tsx  top-bar.stories.tsx
+    squiggle.tsx squiggle.stories.tsx
     page.tsx                1200 px, Picnic gutters
     index.ts  boards.ts
   recipes/
+    recipe-search.ts        useRecipeSearch: the list's ?q= from any page
     recipes-page.tsx        reads q from the address; its search box goes
     recipe-page.tsx         "Back to Tastebook" goes
     index.ts                exports useRecipeSearch
```

**Routes.** `routes.tsx` becomes one parent route, `{ Component: AppLayout, children: [ …the four routes as today… ] }`. The parent has no `path`, so the URLs stay the same.

```tsx
// app/app-layout.tsx
export const AppLayout = () => {
  const { searchText, changeSearchText } = useRecipeSearch();
  return (
    <>
      <TopBar searchLabel="Search recipes" searchValue={searchText} onSearchValueChange={changeSearchText} />
      <Outlet />
    </>
  );
};
```

**Search is owned by the address.** Today `RecipesPage` keeps a local copy of the text (`recipes-page.tsx:165-175`). Now the text exists only in `?q=` on `/recipes`, so there's one owner. `flushSync` keeps the controlled field from lagging a keystroke, as `changeFilters` already does for the chips (`recipes-page.tsx:182`).

```ts
// recipes/recipe-search.ts
export const useRecipeSearch = (): { searchText: string; changeSearchText: (text: string) => void } => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const onList = pathname === '/recipes';
  // Off the list the field is empty; typing there opens the list with the search, and Back returns to the page.
  const searchText = onList ? (new URLSearchParams(search).get('q') ?? '') : '';
  const changeSearchText = useCallback(
    (text: string) => {
      const params = new URLSearchParams(onList ? search : '');
      if (text === '') params.delete('q'); else params.set('q', text);
      const query = params.toString();
      navigate({ pathname: '/recipes', search: query === '' ? '' : `?${query}` }, { replace: onList, flushSync: true });
    },
    [navigate, onList, search]
  );
  return { searchText, changeSearchText };
};
```

The search keeps the filters, as `withParam` does today. Move `withParam` into `recipe-search.ts` if it's still needed, or inline it as above. `RecipesPage` keeps `toSearchTerm`, the 300 ms debounce and the 3-character minimum. It now reads `toSearchTerm(useDebouncedValue(searchParams.get('q') ?? '', SEARCH_DELAY_MS))`. Remove `RecipeSearch`, `searchText` and `handleSearchChange` from `recipes-page.tsx`. The `<search>` element around the Filters button becomes a `<div className="flex flex-col gap-4">`, because the search landmark is now the top bar's. Remove the list's "Back to Tastebook" ghost link and the recipe page's, since the wordmark replaces them. The recipe page keeps its "All recipes" link until part 3.

**TopBar** (`dino/top-bar.tsx`). This is the board's `.top`. It's a `<header>`, full width, with a 1 px Line border at its foot. Its inner row is `mx-auto max-w-300` with the page's gutters, so the wordmark lines up with the content at any width.

```tsx
type TopBarProps = { searchLabel: string; searchValue: string; onSearchValueChange: (text: string) => void };
```

- **Layout.** The inner element is `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6`. Row 1 is 76 px tall (`min-h-19`). The gutters are `pl-[max(--spacing(5),env(safe-area-inset-left))] sm:pl-[max(--spacing(8),env(safe-area-inset-left))]`, and the same on the right. The header has `pt-[env(safe-area-inset-top)]`.
- **Wordmark.** `<NavLink to="/" end>` wraps `<Wordmark />`, in `text-display-l` with `no-underline` and `inline-flex min-h-11 items-center`. Its name is "Tastebook", and NavLink gives it `aria-current="page"` on home.
- **Icon button.** Below `lg`, `<IconButton icon={Search} label={searchLabel} aria-expanded={isSearchShown} aria-controls={searchId} className="lg:hidden" />` sits in column 2.
- **Search field.** `<search id={searchId} ref={searchRef}>` wraps `<Field label={searchLabel} hideLabel>` and `SearchInput` with `placeholder={searchLabel}`.
  - On `lg`, it sits in row 1, column 2, `w-90` (360 px).
  - Below `lg`, it spans both columns on row 2 with `pb-4`. It's `hidden` unless `isSearchShown`.
  - Its classes: `col-span-2 pb-4 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:w-90 lg:pb-0 lg:block`, plus `hidden` when not shown.
- **State.** The component holds `const [isSearchOpen, setIsSearchOpen] = useState(false)` and derives `const isSearchShown = isSearchOpen || searchValue !== ''`. A search that's on always stays visible.
- **Pressing the icon button:**
  - If the field is shown and `searchValue === ''`, it closes: `setIsSearchOpen(false)`.
  - Otherwise `flushSync(() => setIsSearchOpen(true))`, then `searchRef.current?.querySelector('input')?.focus()`.
  - `SearchInput` keeps its own ref for its clear button, which is why the focus goes through the wrapper.
- **Stories:** `Default` (empty) and `IsSearchOpen`. `IsSearchOpen`'s `play` clicks "Search recipes" and keeps the value in React state seeded from args. The visual run's 390 px viewport shows the phone row. In `boards.ts`, `'Dino/TopBar'` maps to `docs/design/dino/layout.dc.png`.

**Page** (`dino/page.tsx`):

```tsx
<main className="mx-auto flex w-full max-w-300 flex-col gap-6 pt-6 pb-[max(--spacing(12),env(safe-area-inset-bottom))] pr-[max(--spacing(5),env(safe-area-inset-right))] pl-[max(--spacing(5),env(safe-area-inset-left))] sm:pt-8 sm:pr-[max(--spacing(8),env(safe-area-inset-right))] sm:pl-[max(--spacing(8),env(safe-area-inset-left))]">
```

The top inset moves to TopBar, which now sits above `<main>`. Update the Page story's copy to "What shall we cook tonight?" so its shot shows Display XL at the new gutters.

**Squiggle** (`dino/squiggle.tsx`). This underlines one word, in Pop. The board draws two fixed paths (86 and 150 px wide). One long repeating path, cut to the word's width, serves any word.

```tsx
type SquiggleProps = { children: ReactNode; emphasis?: boolean };
// emphasis: the word itself turns italic and Pop, as browse's "cook" (Display XL allows one italic word).
export const Squiggle = ({ children, emphasis = false }: SquiggleProps) => (
  <span className={cn('relative inline-block max-w-full', emphasis && 'text-pop italic')}>
    {children}
    <svg aria-hidden="true" viewBox="0 0 400 12" preserveAspectRatio="xMinYMid slice"
      className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full text-pop">
      <path d="M2 7c7-5 12-5 19 0s12 5 19 0 …repeat to x=400" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </span>
);
```

The path repeats the board's `c7-5 12-5 19 0s12 5 19 0` wave (38 px a period) up to x = 400. The stroke is `currentColor` on `text-pop`, so forced colours redraws it (`docs/design.md`, Rules › Type and icons). Stories: `Default` (in an `h1`, under "Tastebook") and `Emphasis` ("What shall we <Squiggle emphasis>cook</Squiggle> tonight?"). In `boards.ts`, `'Dino/Squiggle'` maps to `docs/design/picnic/browse-and-recipe.dc.png`.

**Home** (`app/home-page.tsx`):

```tsx
<Page>
  <title>Tastebook</title>
  <h1><Squiggle><Wordmark /></Squiggle></h1>
  <p className="text-muted">Every recipe in the catalogue, ready to cook.</p>
  <Button asChild className="self-start"><Link to="/recipes">Browse recipes</Link></Button>
  <ApiStatus />   {/* unchanged */}
</Page>
```

**Not found** keeps its markup ("Page not found", the line, the Back to Tastebook button) under the new shell. It has no squiggle.

### The recipe list (part 2)

```diff
 frontend/src/
   dino/recipe-photo.tsx        card sizes for 2 / 3 / 4 a row
   recipes/
     recipes-page.tsx           title, grid, filter column or sheet
     recipe-filter-panel.tsx    tilted prop
     active-filters.tsx         useActiveFilters, countActiveFilters
+    use-media-query.ts         useMediaQuery, isLaptopQuery
   test/setup.ts                matchMedia stub
+  test/media.ts               setLaptop(matches)
```

- **Title.** `<h1>What shall we <Squiggle emphasis>cook</Squiggle> tonight?</h1>`, with `RecipeCount` right under it. The tab title stays "Recipes · Tastebook".
- **Breakpoint in JS.** The list renders either the column or the sheet. That's two different trees, and rendering both would duplicate every filter control. A hook syncs with the external `matchMedia`:

  ```ts
  // recipes/use-media-query.ts
  export const isLaptopQuery = '(min-width: 64rem)'; // Tailwind's lg
  export const useMediaQuery = (query: string) =>
    useSyncExternalStore(
      (onChange) => { const list = window.matchMedia(query); list.addEventListener('change', onChange); return () => list.removeEventListener('change', onChange); },
      () => window.matchMedia(query).matches
    );
  ```

  jsdom has no `matchMedia`. `src/test/setup.ts` stubs it, defaulting to `matches: false` (the phone layout). `src/test/media.ts` exports `setLaptop(matches: boolean)`, which a test calls before `renderRoute`. The stub is reset in `afterEach`. This mocks a browser API, not Tastebook's code.
- **Laptop layout** (`isLaptop`). Below the title and count: `<div className="grid grid-cols-[16.25rem_minmax(0,1fr)] items-start gap-12">`. Column 1 is `<aside aria-label="Filters" tabIndex={-1} ref={filtersHome}>` holding `<RecipeFilterPanel id={FILTER_PANEL_ID} tilted … />`. Column 2 is a `flex flex-col gap-6` holding `<ActiveFilters>` and `<RecipeList>`.
- **Below laptop.** A `flex flex-wrap items-center gap-2` row holds the Filters button and then `<ActiveFilters>`. Under it is `<RecipeList>`. The Filters button is the `trigger` of a controlled `<Sheet title="Filters" open={isPanelOpen} onOpenChange={setIsPanelOpen}>`. The sheet's children are `<RecipeFilterPanel id={FILTER_PANEL_ID} tilted={false} … />` and then a full-width primary `Button` that closes it.
  - The button's label comes from the list query: "Show 24 recipes", or "Show 1 recipe", or "Show recipes" while `data` is undefined or `isPlaceholderData`.
  - `RecipesPage` calls `useRecipes({ searchTerm, filters })` for the count. It's the same query key `RecipeList` uses, so there's no second request.
- **Filters button.** `variant="secondary"`, with the `SlidersHorizontal` icon. Its label is `Filters` when `countActiveFilters` gives 0, and `Filters · ${count}` otherwise. Drop `aria-expanded` and `aria-controls`, since Radix's trigger sets `aria-haspopup="dialog"` and `aria-expanded` itself.
- **countActiveFilters** (`active-filters.tsx`, exported): the number of chips under Filters on, from `useActiveFilters`, so a slug the loaded lists don't know is counted no more than it gets a chip. "With all of these" isn't counted: `includeMatch` isn't a filter of its own. (Review round 1 replaced `countFilters`, which counted unknown slugs: `/recipes?cuisine=bogus` read "Filters · 1" with no chip.)
- **Focus after removing a chip.** The removed chip or "Clear filters" disappears, so `removeFilters` focuses `filtersHome.current`. That's the Filters button below laptop and the `<aside>` on a laptop. Both attach the same ref.
- **Tilt.** `RecipeFilterPanel` takes `tilted: boolean`. When true, every `FilterChip` in it gets `tilt={index % 2 === 0 ? 'left' : 'right'}`, by its index within its group. The sheet is a dialog, and `docs/design.md` (Tilt) never tilts dialogs, so the sheet passes `false`.
- **Grid.** `<ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-9 lg:gap-y-11 large-text:grid-cols-1">`. The lean still alternates by index. `FIRST_ROW_LENGTH` becomes 4, the longest first row.
- **Card photo sizes** (`dino/recipe-photo.tsx`, `card`), from the grid above less the 16 px of frame:
  - Large text: `(width < 17.5em) calc(100vw - 3.5rem)`
  - From 1200 px: `(min-width: 75rem) 10.25rem`
  - Laptop: `(min-width: 64rem) calc(25vw - 8.5rem)`
  - Tablet: `(min-width: 40rem) calc(33.3vw - 3.4rem)`
  - Phone: `calc(50vw - 2.75rem)`

### The recipe page (part 3)

```diff
 frontend/src/
   dino/
     polaroid.tsx              tape?: boolean
+    time-blobs.tsx   time-blobs.stories.tsx
+    amount-list.tsx  amount-list.stories.tsx
+    method.tsx       method.stories.tsx
     recipe-photo.tsx          hero sizes for the two columns
     picnic.css                --radius-blob-1, -2, -3
     index.ts  boards.ts  polaroid.stories.tsx
   ../../tools/biome/no-arbitrary-radius.grit   message names the blob tokens
   ../../docs/design.md        Corners names the blob shapes
   recipes/
     recipe-page.tsx           two columns, intro, controls
-    recipe-facts.tsx          replaced by RecipeIntro's lines and TimeBlobs
+    recipe-intro.tsx          title + squiggle, description, muted lines, blobs
     recipe-ingredients.tsx    AmountList; stepper and Show original move out
     recipe-method.tsx         Dino Method
     recipe-page.test.tsx
```

**Tape** (`Polaroid`). Add `tape?: boolean`. When true, the frame gets `relative` and its first child is `<span aria-hidden="true" className="absolute -top-2.75 left-1/2 h-5.5 w-18 -translate-x-1/2 bg-tape" />`. That's the board's `.tape`: 72 × 22 px, centred, 11 px over the top edge. Add a `Large Taped` story.

**TimeBlobs** (`dino/time-blobs.tsx`):

```tsx
type TimeBlob = { label: string; value: string };
// Peach, butter, mint in order, each with its own fixed shape (docs/design.md, Blobs); at most three.
type TimeBlobsProps = { times: [TimeBlob, TimeBlob] | [TimeBlob, TimeBlob, TimeBlob] };
```

- It renders `<dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-[repeat(3,9.375rem)] large-text:grid-cols-1">`.
- Each blob is `<div className="flex flex-col-reverse items-center border-2 border-transparent px-2 py-3 text-center text-on-pastel">`, holding `<dt className="text-small">{label}</dt>` and `<dd className="break-words font-serif text-title">{value}</dd>`.
- Its fill and shape come from a fixed list: `bg-peach rounded-blob-1`, `bg-butter rounded-blob-2` and `bg-mint rounded-blob-3`.
- The shapes become corner tokens in `frontend/src/dino/picnic.css`, since `tools/biome/no-arbitrary-radius.grit` fails any `rounded-[…]`:
  - `--radius-blob-1: 46% 54% 42% 58% / 55% 45% 55% 45%;`
  - `--radius-blob-2: 58% 42% 55% 45% / 45% 55% 45% 55%;`
  - `--radius-blob-3: 42% 58% 48% 52% / 52% 48% 52% 48%;`
- Add the blobs to `docs/design.md`'s Corners line ("the three blob shapes for a recipe's times"). Add `-blob-1, -blob-2, -blob-3` to the plugin's message list.
- The transparent border is what forced colours draws.
- Stories: `Default` (15 min, 1 hr 30 min, Soaking 12 hr) and `TwoTimes`. In `boards.ts`, it maps to `docs/design/dino/layout.dc.png`.

**AmountList** (`dino/amount-list.tsx`):

```tsx
type AmountItem = { key: string | number; name: ReactNode; amount: string };
// amount '' (a line with no quantity, or an original line) shows the name alone, with no leader.
export const AmountList = ({ items }: { items: AmountItem[] }) => (
  <ul className="flex flex-col tabular-nums">
    {items.map(({ key, name, amount }) => (
      <li key={key} className="flex items-baseline gap-2 py-1.75">
        <span className="min-w-0 break-words">{name}</span>
        {amount !== '' && <>{' '}<span aria-hidden="true" className="min-w-4 grow -translate-y-1 border-field border-b-2 border-dotted" />{' '}<span className="shrink-0 font-extrabold">{amount}</span></>}
      </li>
    ))}
  </ul>
);
```

The `{' '}` keeps a space between name and amount in the text a screen reader and `getByText` see, since flex drops it from the layout. Stories: `Default` (Dried chickpeas 250 g, Water 500 ml, Salt with no amount) and `LongName` (a 60-character name at 390 px wraps without pushing the amount off). In `boards.ts`, it maps to `layout.dc.png`.

**Method** (`dino/method.tsx`). This is the Components table's Method.

```tsx
type MethodProps = { steps: { key: string | number; text: string }[] };
```

- It renders `<ol className="flex flex-col">`. Each `<li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2 border-line border-t py-4">` holds two children.
- The first is `<span aria-hidden="true" className="font-serif text-[2rem]/[1.875rem] text-pop italic lg:text-[2.375rem]/[1.875rem]">{n}</span>`. The `<ol>` already gives each step its number for a screen reader.
- The second is `<p className="max-w-[62ch] break-words lg:text-[1.0625rem]/[1.6875rem]">{text}</p>`.
- `docs/design.md` (Components › Method) sets 38 px on a laptop, 32 px on a phone and 17/27 on a laptop. Those aren't type tokens, so they're arbitrary sizes in this one component.
- Stories: `Default` (the board's four steps). In `boards.ts`, it maps to `layout.dc.png`.

**Recipe page structure.** The DOM follows the narrow order at every width, so reading and focus order match what's seen. On a laptop, the grid places the parts into two columns:

```tsx
<Page>
  <Link to="/recipes" className="…standalone link…"><ChevronLeft aria-hidden="true" />All recipes</Link>
  <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10 max-lg:max-w-2xl">
    <div className="lg:col-start-1 lg:row-start-1 lg:px-6 lg:pt-2">{/* StickeredPhoto > Polaroid frame="large" lean="left" tape */}</div>
    <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-1">{/* RecipeIntro, then RecipeControls */}</div>
    <section className="self-start lg:sticky lg:top-6 lg:col-start-1 lg:row-start-2 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">{/* Ingredients */}</section>
    <section className="lg:col-start-2 lg:row-start-2">{/* Method */}</section>
  </div>
</Page>
```

- **"All recipes"** moves to the top as the board's standalone link: Label type, a chevron-left icon, 44 px tall, `no-underline hover:underline`. It replaces the ghost button at the foot.
- **Sticky ingredients.**
  - The ingredients stay in view while the method scrolls. They scroll inside themselves when they're taller than the window.
  - That makes the section a scroll region, so on a laptop it gets `tabIndex={0}` and keeps its `aria-labelledby` heading, which lets a keyboard scroll it (WCAG 2.1.1).
  - `RecipeIngredients` reads `useMediaQuery(isLaptopQuery)`, which part 2 adds, to set `tabIndex` only on a laptop.
- **Single column.** Below `lg` it's capped at 42 rem (`max-lg:max-w-2xl`), so a tablet's photo and lines don't stretch to 960 px.
- **Hero photo sizes** (`dino/recipe-photo.tsx`, `hero`):
  - From 1200 px: `(min-width: 75rem) 26.7rem`
  - Laptop: `(min-width: 64rem) calc(41.7vw - 4.6rem)`
  - Wide tablet: `(min-width: 46rem) 40.75rem`
  - Tablet: `(min-width: 40rem) calc(100vw - 5.25rem)`
  - Phone: `calc(100vw - 3.75rem)`

**RecipeIntro** (`recipes/recipe-intro.tsx`, replacing `recipe-facts.tsx`) renders these, in order:

1. `<h1>` with the name, its longest word (the first of equals, splitting on spaces) wrapped in `<Squiggle>`. The heading's text stays the full name.
2. The description, `text-muted`, when not empty.
3. The facts line: `<p className="text-muted tabular-nums">`, the parts joined with " · ", leaving out empty ones.
   - It starts with `formatMinutes(recipe.total_minutes)`, the same number the list shows under the polaroid.
   - Then `difficultyLabels[recipe.difficulty]`, then `One-pot` when `one_pot`.
   - Then the cuisines' names joined with ", ", then the courses' names joined with ", ".
   - When there are no ingredients, it ends with `Serves N` or `Makes N <unit>`, since there's no stepper to say it.
4. `Equipment: Oven, Hob`, `text-muted`, when there's any equipment.
5. `Source: <source>`, `text-muted`. The source is a link when `source_url` isn't empty, as `SourceCredit` does today. The line is left out when `source` is empty.
6. The diet tag conflict lines, as today.
7. `<TimeBlobs>`:
   - `{ label: 'Prep', value: formatMinutes(prep_minutes) }`
   - `{ label: 'Cook', value: formatMinutes(cook_minutes) }`
   - and, when `extra_minutes > 0`, `{ label: capitalise(extra_label), value: formatMinutes(extra_minutes) }`.

**RecipeControls.** A `flex flex-wrap items-center gap-2` row holds three things:

- the `ServingsStepper`, when the recipe has ingredients and servings or a yield;
- the Units `SegmentedControl`, when it has ingredients or steps;
- the `Show original` chip, under the same condition as today.

The state that was split between `RecipeIngredients` and `RecipeIngredientsAndMethod` moves into one parent, `RecipeBody`, still keyed by `recipe.id`. `RecipeBody` holds `scaledTo`, `system` and `showOriginal`. It derives one `reading` (`{ factor, system, showOriginal }`) and passes it to the controls, the ingredients and the method.

**Ingredients.** `<h2>Ingredients</h2>`, then one `AmountList` for the ungrouped lines, then for each group its `<h3>` and its `AmountList`.

- Each item's `name` is the ingredient's name with its first letter capitalised, plus `, <note>` when there's a note, plus a muted " (optional)" when optional.
- Its `amount` is `formatQuantity(convert(line, factor, system))`.
- With Show original on, a line with `original_text` shows `{ name: original_text, amount: '' }`.
- `describeLine` stays only for `differsFromOriginal`.

**Method.** `<h2>Method</h2>`, then `<Method steps={…}>` with each step's text converted as today.

## Decisions

- **Three parts:** the shell, the list, the recipe. Each part merges to `main` on its own. Asked: ship as three PRs? → Three parts.
- **Home is a thin landing:** the top bar, the wordmark heading with its squiggle, one line, Browse recipes and the API status. It isn't a redirect, so the health check stays on screen and a dashboard can go there later. Asked: what should home be? → Thin landing.
- **The squiggle, blobs, leaders, tape and method go in Dino,** each with stories, forced-colours baselines and the design-system review. Tape is a prop on `Polaroid`. Method is in the doc's Components table too. Asked: where should these live? → Dino components.
- **The facts off the board go in muted lines under the description, with total time first.** The line reads "45 min · Easy · One-pot · Indian · Main", using the same `formatMinutes(total_minutes)` the list shows. Then come an "Equipment:" line and a "Source:" line. Asked: where do cuisine, course, difficulty, one-pot, equipment, source and total go? → Muted lines, but keep total time first, the same number as on the list.
- **Below 1024 px, the search icon button shows the field full width under the bar and focuses it.** The field stays shown while a search is on. Asked: what should the search icon button do? → Field under the bar.
- **No featured polaroid on phones.** The list stays a plain grid. The empty state's doodle remains the screen's only one. Asked: a featured polaroid with the doodle? → Leave it out.
- **Until its part lands, the recipe list and the recipe page each keep a centred 672 px column inside the 1200 px `Page`,** so `main` never shows them stretched on a laptop (the recipe's photo upscaling, the method running full width). Parts 2 and 3 each remove their page's column. Asked (review, round 1): show them stretched to 1200 px until parts 2 and 3? → Keep 672 px until each part.
- **The address owns the search text.** The top bar lives in a layout and outlives the list page, so a local copy would go stale on Back or on leaving the list. `flushSync` keeps the field in step, as the chips already do. Typing off the list pushes `/recipes?q=…`, so Back returns to the recipe, and on the list it replaces. (agent)
- **TopBar takes the search's value and handler, not a slot,** so the icon button can open and focus the field it owns. Dino stays free of `recipes`. (agent)
- **The filter layout switches with a `matchMedia` hook, not CSS.** The column and the sheet are different trees. Rendering both hides one and duplicates every control in tests and in the accessibility tree whenever the sheet opens on a resize. `useSyncExternalStore` is the sanctioned way to sync with a browser API. (agent)
- **The recipe page keeps the narrow order in the DOM at every width.** On a laptop, row 1 is as tall as the taller of the photo and the intro, which on the board are about level. The alternative, two DOM columns reordered on phones, would put the ingredients before the title for a screen reader and the tab order (WCAG 2.4.3). (agent)
- **The sticky ingredients scroll inside themselves when taller than the window, and are focusable on a laptop.** Otherwise a long list's foot is unreachable until the method ends. (agent)
- **The servings stepper, units and Show original move into one controls row under the blobs,** as `docs/design.md` (Layout) orders them. On phones, the board's stepper beside the Ingredients heading is a board detail the doc's order replaces. (agent)
- **The recipe's squiggle goes under the longest word of its name.** The doc says one word. The first word is often "A" or "The". (agent)
- **The top bar's inner row is capped at 1200 px like the content,** so the wordmark lines up with the title on wide screens. The board only draws 1280 px. (agent)
- **No squiggle on not found.** One is allowed per screen, not required, and "not found" has no word worth celebrating. (agent)
- **The filters sheet's chips aren't tilted, while the laptop column's are.** `docs/design.md` (Tilt) says browse's filter chips tilt but dialogs never do, and a sheet is a dialog. (agent)
- **The blob values use `formatMinutes` ("1 hr 30 min"),** so the blobs, the facts line and the list all read the same. They may wrap inside a blob on a phone. (agent)

Where the boards and `docs/design.md` disagree, this spec builds to the doc (`specs/lessons/design-doc-wins-over-a-board.md`):

- **Peach buttons:** the board draws peach Search, Back and Favourite buttons. The doc's Icon button is never peach and supersedes them, so the search icon button is Surface. There's no Back button (the "All recipes" link does that job) and no Favourite (no favourites yet).
- **Blob labels:** the board labels the blobs "prep", "cook" and "soak first". The doc's Voice is sentence case, so they read Prep, Cook and the recipe's own extra label capitalised ("Soaking", "Marinating").
- **Blob type:** the board's blob values are serif 26/28, which isn't a type role. They use Title's size (28/30) in the upright serif, the nearest role.
- **Wordmark size:** the board's top bar wordmark is 30/32. It uses Display L (34/36), the nearest role.
- **Ingredient names:** the board capitalises them ("Dried chickpeas"), but the data is lower case. They're capitalised for display only. Show original is left as written.
- **Tilt:** the board tilts the recipe photo 2°. The doc's polaroid tilt is 2 to 4°, so it keeps `Polaroid`'s 3°.
- **Frame padding:** the board's hero has a thicker bottom frame. It keeps the doc's 10 px Paper frame with the credit inside it.
- **Laptop chips:** the board's laptop filter chips are straight. The doc tilts browse's filter chips, so the column's chips tilt.
- **No dock or Let's get cooking:** both are drawn. The doc says the dock waits for a second tab, and the issue says no "Let's get cooking" until Cooking mode exists.

## Assumptions

- Home's line under the wordmark reads "Every recipe in the catalogue, ready to cook." Confirm with: Milo at spec approval.
- The list's "Show N recipes" sheet button is primary. The sheet is the only thing in front of the page while it's open, so its one peach button doesn't compete with the page's. Confirm with: Milo at spec approval.
- `react-router`'s `navigate` and `setSearchParams` accept `flushSync` in the installed version (8.5). `setSearchParams` already does at `recipes-page.tsx:182`. If `navigate` doesn't, the implementer uses `flushSync(() => navigate(…))` from `react-dom`. Confirm with: the implement stage, by the "types a search off the list" test.

## Out of scope

- The dock, tabs in the top bar and any navigation. They wait for a second tab (`docs/design.md`, Layout).
- A featured polaroid, its butter time sticker and the "start it tonight!" doodle (asked: leave it out).
- The "Let's get cooking" button and cooking mode.
- Favourites and the board's Favourite button.
- A quick-filters chip row on the list (the phone board's Quick, Veggie, One-pot, Sweet). Filters stay in the panel.
- Any change to the API, to what the filters and search do, or to how amounts scale and convert.
- Restyling Dino components beyond tape on `Polaroid`, the `Page` shell, `RecipePhoto`'s `sizes` and the three blob corner tokens.
- Lighthouse or axe configuration. The existing preview checks cover every page the Playwright specs visit.

### Steps

**Part 1 (this issue)**

1. **Squiggle.** `frontend/src/dino/squiggle.tsx`, `squiggle.stories.tsx` (new); `dino/index.ts`, `dino/boards.ts` (edit).
   Build the Squiggle as sketched, with `Default` and `Emphasis` stories.
   Done when: `pnpm test` runs both stories with axe passing.
2. **TopBar.** `frontend/src/dino/top-bar.tsx`, `top-bar.stories.tsx` (new); `dino/index.ts`, `dino/boards.ts` (edit).
   Build the TopBar as sketched, with `Default` and `IsSearchOpen` stories.
   Done when: `pnpm test` passes both stories, including the 44 px target check, and `IsSearchOpen` shows the field with focus.
3. **Page shell.** `frontend/src/dino/page.tsx`, `page.stories.tsx` (edit).
   Apply the 1200 px width and the gutters.
   Done when: the Page story renders at 20 px gutters at 390 px.
4. **Search hook.** `frontend/src/recipes/recipe-search.ts` (new); `recipes/index.ts` (edit).
   Add `useRecipeSearch` as sketched and export it.
   Done when: `pnpm lint` passes.
5. **Layout route.** `frontend/src/app/app-layout.tsx` (new); `app/routes.tsx` (edit).
   Wrap the four routes in `AppLayout`.
   Done when: every existing page test still finds its page's heading.
6. **List and recipe pages.** `frontend/src/recipes/recipes-page.tsx`, `recipe-page.tsx` (edit).
   Remove the list's search box and local text, and read `q` from the address. Remove both "Back to Tastebook" links. Turn the list's `<search>` into a `div`.
   Done when: the search tests in `recipes-page.test.tsx` pass against the top bar's field.
7. **Home and not found.** `frontend/src/app/home-page.tsx`, `not-found-page.tsx` (edit).
   Build home as sketched. Not found needs no markup change beyond the shell.
   Done when: `home-page.test.tsx` and `not-found-page.test.tsx` pass.
8. **Tests.** Write or adjust the tests listed below for part 1. `e2e/recipes.spec.ts` needs no change: the list's heading stays "Recipes" until part 2, and the searchbox keeps its name.
   Done when: `pnpm test` and `pnpm test:e2e` pass.
9. **Baselines.** Run `pnpm --filter frontend test:visual:update` and look at each new or changed shot against its board: Squiggle ×2, TopBar ×2 and Page, each at both sizes and under forced colours.
   Done when: `pnpm --filter frontend test:visual` passes and the baselines are committed.

**Part 2 (sub-issue)**

1. `use-media-query.ts`, the `matchMedia` stub and `test/media.ts`. Done when: a test with `setLaptop(true)` renders the aside.
2. `useActiveFilters` and `countActiveFilters` in `active-filters.tsx`. Done when: the Filters button test passes for an unknown cuisine.
3. `RecipeFilterPanel`'s `tilted` prop. Done when: `pnpm lint` passes.
4. `recipes-page.tsx`: the title, the laptop column, the sheet, the Filters count and focus after removal. Done when: `recipes-page.test.tsx` passes.
5. The grid classes, `FIRST_ROW_LENGTH` and the card `sizes`. Done when: the photo test asserts the new `sizes`.
6. E2E updates (the heading name, the Filters button name) and the list's forced-colours test. Then `test:visual:update` (no Dino story should change except RecipePhoto's, if any) and the preview checks. Done when: `pnpm test:e2e` passes and the preview's checks comment is green.

**Part 3 (sub-issue)**

1. `Polaroid`'s `tape`, with a story. Done when: the `Large Taped` story's shot shows the tape.
2. The blob corner tokens in `picnic.css`, the Corners line in `docs/design.md` and the plugin message. Done when: `pnpm lint` passes with `rounded-blob-1` in use.
3. `TimeBlobs`, `AmountList` and `Method`, with stories and `boards.ts` entries. Done when: `pnpm test` runs their stories with axe passing.
4. `recipe-intro.tsx`. Delete `recipe-facts.tsx`. Done when: the intro tests below pass.
5. `recipe-ingredients.tsx`, `recipe-method.tsx` and `RecipeBody`'s state. Done when: the scaling and conversion tests pass on the new markup.
6. `recipe-page.tsx`'s grid, the top "All recipes" link, the sticky section and the hero `sizes`. Done when: `recipe-page.test.tsx` passes and `e2e/phone-width.spec.ts` shows no sideways scroll.
7. E2E updates, the recipe's forced-colours test, baselines and the preview checks. Done when: `pnpm test:e2e` and `test:visual` pass and the preview's checks comment is green.

### Tests

**Part 1**

- `frontend/src/app/home-page.test.tsx` (edit)
  - Home's heading, asserts: `getByRole('heading', { level: 1, name: 'Tastebook' })` exists, and the Squiggle's word inside it reads "Tastebook".
  - The top bar's wordmark on home, asserts: the link named "Tastebook" has `href="/"` and `aria-current="page"`.
  - The existing "Browse recipes" test: change its heading assertion from `'Recipes'` only if part 2 has landed. In part 1 it stays "Recipes".
- `frontend/src/app/not-found-page.test.tsx` (edit)
  - Not found under the top bar, asserts: at `/no-such-page`, the heading "Page not found", the "Back to Tastebook" link to `/` and the top bar's "Search recipes" searchbox are all present.
- `frontend/src/app/app-layout.test.tsx` (new), through `renderRoute`
  - `it.each` over `/`, `/recipes`, `/recipes/shakshuka` and `/no-such-page`, asserts: one `banner` landmark holding a link named "Tastebook" with `href="/"`.
  - Types a search off the list, asserts: from `/recipes/shakshuka`, typing "tart" into "Search recipes" leaves `router.state.location` at pathname `/recipes`, search `?q=tart`. The searchbox has value "tart" and focus, and the list shows "Apple tart".
  - Back after a search from a recipe, asserts: after the step above, `router.navigate(-1)` returns to `/recipes/shakshuka` and the searchbox is empty.
  - Opens the field from the icon button, asserts: clicking the button named "Search recipes" sets its `aria-expanded` to `"true"` and moves focus to the searchbox. Clicking it again with the field empty sets `aria-expanded` to `"false"`.
  - Keeps the field open while a search is on, asserts: at `/recipes?q=tart`, the button's `aria-expanded` is `"true"`, and clicking it keeps it `"true"` and focuses the searchbox.
- `frontend/src/recipes/recipes-page.test.tsx` (edit)
  - The search tests (lines 394-490) keep their assertions. `searchBox()` now finds the top bar's searchbox by the same name.
  - "keeps the cuisine while typing a search", asserts: as today, `?cuisine=…&q=…` both present after typing.
  - Delete "takes the visitor home from the back link" (the link is gone). The `app-layout` wordmark test covers the way home.
- `frontend/src/recipes/recipe-page.test.tsx` (edit)
  - The parametrised back-link test (lines 660-670) drops its two "Back to Tastebook" rows and keeps "All recipes".
- `frontend/e2e/forced-colours.spec.ts` (new), with `page.emulateMedia({ forcedColors: 'active' })`. The fixture's axe check runs at each test's end.
  - Home, asserts: the squiggle's `path` computed `stroke` equals the `h1`'s computed `color`. It also attaches a full-page screenshot to the report for review.
  - Not found, asserts: the heading "Page not found" is visible and axe finds no violations. It attaches a screenshot.
- `frontend/e2e/phone-width.spec.ts` (edit)
  - Search from the top bar on a phone, asserts: at 375 px on `/`, the searchbox is hidden. Clicking "Search recipes" shows it focused, filling "xyzzy" reaches `/recipes?q=xyzzy`, and `sidewaysScroll` is 0.
- `frontend/e2e/home.spec.ts`: unchanged assertions; they still find the heading "Tastebook".

**Part 2**

- `frontend/src/recipes/recipes-page.test.tsx` (edit)
  - The title, asserts: `getByRole('heading', { level: 1, name: 'What shall we cook tonight?' })`.
  - Laptop column, asserts: with `setLaptop(true)`, the `complementary` landmark "Filters" holds the group "Cuisine". There's no button named "Filters", and no dialog.
  - Phone sheet, asserts: by default, clicking "Filters" opens a dialog named "Filters" holding the group "Cuisine". Choosing Italian, then clicking "Show 1 recipe", closes the dialog and the address has `cuisine=italian`.
  - The count in the Filters button, asserts: at `/recipes?cuisine=italian&max_total=30`, the button is named "Filters · 2". At `/recipes`, it's named "Filters".
  - Focus after removing a chip, asserts: phone, focus is on "Filters"; laptop, focus is on the "Filters" complementary landmark.
  - The photo test, asserts: the new `sizes` string literally, and `loading="eager"` on the first four cards.
  - Existing filter tests open the sheet with "Filters" and find controls inside the dialog. Update the `{ name: 'Filters', exact: true }` lookups where filters are on.
- `frontend/e2e/forced-colours.spec.ts` (edit)
  - The list on a laptop (1280 px) with `?cuisine=italian`, asserts: the pressed "Italian" chip's computed `border-top-color` isn't `rgba(0, 0, 0, 0)`. Attaches a screenshot.
- `frontend/e2e/recipes.spec.ts` (edit)
  - Tilted chips only in the column, asserts: at 1280 px, the first Total time chip's computed `transform` isn't `none`. At 375 px, inside the Filters dialog, the same chip's `transform` is `none`.
- `frontend/e2e/recipes.spec.ts`, `recipe.spec.ts` and `phone-width.spec.ts` (edit): the heading name becomes "What shall we cook tonight?". The Filters button lookups take the count.

**Part 3**

- `frontend/src/recipes/recipe-page.test.tsx` (edit)
  - The facts line, asserts: for a recipe with total 45, easy, one-pot, cuisine Indian, course Main, the paragraph reads exactly "45 min · Easy · One-pot · Indian · Main". For Shakshuka (no cuisine, one-pot, course Main, servings 2, no ingredients), it reads "35 min · Easy · One-pot · Main · Serves 2".
  - The blobs, asserts: terms and definitions read `[['Prep','10 min'],['Cook','25 min']]` for Shakshuka, and add `['Soaking','12 hr']` for a recipe with `extra_minutes: 720, extra_label: 'soaking'`.
  - Equipment and source lines, asserts: the paragraphs "Equipment: Hob" and "Source: Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)" exist. With `source_url`, the link of that name has that `href`.
  - The squiggle's word, asserts: for "Slow-roasted pork shoulder", the heading's name is the full title, and the squiggled span's text is "Slow-roasted".
  - Leaders, asserts: the list item reads "Dried chickpeas 250 g" (normalised whitespace). Doubling the servings makes it "Dried chickpeas 500 g". A line with no quantity reads its name alone.
  - Show original, asserts: the item reads the original text exactly, with no amount.
  - The method, asserts: an ordered list with as many items as steps. The first item's text contains the converted temperature as today.
  - No "Let's get cooking", asserts: `queryByRole('button', { name: /Let's get cooking/ })` is null, while the "More servings" button exists.
  - Order, asserts: in DOM order, the h1 comes before the "Ingredients" h2, which comes before the "Method" h2.
  - Laptop focusable ingredients, asserts: with `setLaptop(true)`, the region named "Ingredients" has `tabindex="0"`. By default it has no `tabindex`.
- `frontend/e2e/forced-colours.spec.ts` (edit)
  - The recipe on a laptop, asserts: the first blob's computed `border-top-style` is `solid` and its colour isn't transparent. The first leader's `border-bottom-style` is `dotted`. Attaches a screenshot.
- `frontend/e2e/recipe.spec.ts` (edit)
  - Sticky ingredients on a laptop, asserts: at 1280 × 800, after scrolling to the last method step, the "Ingredients" heading's bounding box top is within the viewport.

**Every part**

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e`
- [ ] `pnpm --filter frontend test:visual` with the new and changed baselines committed
- [ ] Each part's preview checks comment passes axe and Lighthouse on the pages it changes
- Evidence: feature. A laptop screenshot of the part's main page, a phone screenshot per state named in its behaviours, and a walkthrough.

## Validation criteria

- [ ] Behaviours 1 to 8 hold on part 1's preview at 375, 834 and 1280 px.
- [ ] Behaviours 9 to 13 hold on part 2's preview.
- [ ] Behaviours 14 to 23 hold on part 3's preview.
