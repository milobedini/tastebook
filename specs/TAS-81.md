---
issue: TAS-81
status: building # draft | approved | building | done
branch: tastebook/tas-81-show-recipes-as-polaroids-with-stickers-and-a-fallback-for
pr: 84
---

# Show recipes as polaroids, with stickers and a fallback for no photo

Linear: TAS-81

## Summary

Recipes still show in Enamel's shapes: a Surface card with a small photo, butter Tags, and a cuisine-coloured plate where there's no photo. This work builds Picnic's polaroids to the polaroids board: a Polaroid card in the recipe list, a polaroid round the photo at the top of a recipe, a drawn place setting or gingham rug where a recipe has no photo, and Stickers for diet tags in place of Tag. Above about 150% text, tilt turns off and stickers move below the photo. It lands in two PRs, each merging to `main` on its own:

- **Part 1 (this issue, TAS-81):** Polaroid, Polaroid card, the photo fillers, the large-text variant, both recipe pages moved onto them, and Recipe card and CuisinePlate removed.
- **Part 2 (a sub-issue filed when this spec is approved):** Sticker replaces Tag; diet stickers go on the recipe's polaroid, and difficulty and one-pot move to a line under the title.

Evidence: feature — the recipe list and every recipe's page change look.
Design: skip — the polaroids board (`docs/design/dino/polaroids.dc.html`) draws the Polaroid card in every state, both fillers, the stickers and the 200% text layout, and the browse and recipe board draws the polaroid at the top of a recipe; build to the boards.
Components: Polaroid (new), PolaroidCard (new, replaces RecipeCard), PhotoFiller (new, replaces CuisinePlate), RecipePhoto (changed: 7:5 hero, fillers, recipe ID), Sticker (new, part 2, replaces Tag).

## Required reading

- `AGENTS.md`: hard constraints, Tests (black box, baselines only on a GitHub Actions runner) and the `dino` label rule in Standards.
- `docs/design.md`: Space and shape (Corners, Shadows, Photos, Motion), States (Hover, Pressed, Focus), The fun, rationed (Polaroids, Tilt, Stickers), Components (Polaroid card, Sticker), Rules (Colour, Shape). Where a board and this file disagree, this file wins.
- `docs/design/dino/polaroids.dc.html` and `.dc.png`: the board. Its `<style>` block (`.pol`, `.card`, `.stk`, `.gingham`) and the fillers' inline SVG hold the values this spec quotes.
- `docs/design/picnic/browse-and-recipe.dc.html` lines 70-77 and its PNG: the polaroid at the top of a recipe, with the credit inside its frame and the two stickers.
- `frontend/src/dino/recipe-card.tsx`, `frontend/src/dino/recipe-photo.tsx`, `frontend/src/dino/cuisine-plate.tsx`, `frontend/src/dino/tag.tsx`: what this replaces.
- `frontend/src/dino/button.tsx`: the `Record`-of-classes and state-class pattern to mirror.
- `frontend/src/dino/checkbox-row.tsx`: prior art for `group` and `group-active:` on a Dino component, which its stories force with `isPressed`.
- `frontend/visual/stories.spec.ts` and `frontend/playwright.visual.config.ts`: how every story is shot; part 1 adds a project for 200% text.
- `specs/lessons/factory-runs-make-baselines-in-place.md`: how to make the baselines on the run's own runner.
- `specs/lessons/story-play-leaves-real-focus.md` and `specs/lessons/storybook-under-vitest-has-no-manager.md`: Is Focus forces its ring with pseudo-states; forced states aren't applied under Vitest, so don't assert on them.
- `specs/lessons/wikimedia-photos-load-anonymously.md`: keep `crossOrigin="anonymous"` on every photo.
- `specs/lessons/screenshot-tolerance-is-in-pixels.md`: the screenshot tolerance the new project keeps.

## Product behaviour

**Part 1: polaroids**

1. Each recipe in the list shows as a polaroid: its photo in a Paper frame, its name as an italic serif caption.
2. List polaroids have 4:3 photos in an 8 px frame; the recipe's polaroid has a 7:5 photo in a 10 px frame.
3. The recipe's photo credit sits inside its polaroid's frame, under the photo.
4. List polaroids lean 3 degrees, alternating left and right down the list; the recipe's polaroid leans left.
5. Polaroids carry the lift shadow.
6. A list polaroid shows only its meta under it ("35 min · Easy · Korean"), in Small muted.
7. Hovering a list polaroid straightens it a little and lifts it.
8. Pressing a list polaroid settles it.
9. A focused list polaroid has a square, untilted ring round the polaroid and its meta.
10. The whole list polaroid is one link, named by the recipe's name.
11. A recipe without a photo keeps its frame and caption, with a drawn place setting or gingham rug instead.
12. A recipe always gets the same filler, picked from its ID: even IDs the place setting, odd the rug.
13. A photo that fails to load shows the recipe's filler, without a credit.
14. Above about 150% text, polaroids sit straight, and list polaroids take the full width.
15. The recipe list shows two polaroids a row.
16. Every Polaroid, Polaroid card and photo filler story, including no photo and 200% text, has a baseline matching the board.
17. The Recipe card and CuisinePlate stories and their baselines are gone.

**Part 2: stickers**

18. A recipe's diet tags show as pink stickers on its polaroid, tilted 8 degrees.
19. Vegetarian and dairy-free don't show as stickers when the recipe is vegan.
20. At most two stickers sit on the photo; any more sit straight below it.
21. Above about 150% text, every sticker sits straight below the photo.
22. Stickers are text, never buttons or links.
23. A recipe's difficulty and one-pot show as a line under its title ("Easy · One-pot").
24. Every Sticker story, including on a polaroid and 200% text, has a baseline matching the board.
25. The Tag story and its baseline are gone.

## Technical design

### How it works today

- `RecipeCard` (`frontend/src/dino/recipe-card.tsx:16-32`) is a Surface `article` with a 5.75rem `RecipePhoto` and an `h2` whose link's `::after` covers the card. The list (`frontend/src/recipes/recipes-page.tsx:74-95`) puts the meta, the description and the diet tags (`Tag`) in it, one card a row (`recipes-page.tsx:136`).
- `RecipePhoto` (`frontend/src/dino/recipe-photo.tsx:98-131`) renders the `img` with its `srcSet`, `sizes` and loading per shape (`card` 4:3, `hero` 16:10), keeps a failed address in state, and falls back to `CuisinePlate` when there's no photo or the load fails. With a `caption`, it wraps the image in a `figure` with a muted `figcaption`, so a failed photo loses its credit too.
- The recipe page (`frontend/src/recipes/recipe-page.tsx:276-311`) shows `RecipePhoto shape="hero"` with `RecipePhotoCredit` as its caption, then the `h1`, the description, and a list of Tags (difficulty, one-pot, diet tags).
- `picnic.css:103-112` holds the `--cuisine-*` colours only `CuisinePlate` uses; `frontend/scripts/dino-bundle.ts:146-153` describes them in the bundle.

### The large-text variant (part 1)

One custom variant in `frontend/src/dino/picnic.css`, after the `@theme` block, used by every polaroid and sticker rule:

```css
/* Browser and phone zoom narrow the viewport in CSS px, and em in a media query follows the browser's text size,
   so a viewport under 17.5em catches both at about 150% and up on a phone. */
@custom-variant large-text (@media (width < 17.5em));
```

At 200% on a 390 px phone the viewport is 195 px, under 280 px (17.5em at 16 px). A laptop at 200% zoom is 640 px wide and keeps its tilt; that's the accepted trade-off.

### Tokens (part 1)

`picnic.css`, in the shadows group after `--shadow-lift`:

```css
--shadow-lift-hover: 0 18px 36px rgb(0 0 0 / 0.42);
--shadow-lift-pressed: 0 6px 14px rgb(0 0 0 / 0.35);
```

Delete the `:root` `--cuisine-*` block (`picnic.css:105-111`), keeping `color-scheme: dark`.

### Polaroid (part 1)

New `frontend/src/dino/polaroid.tsx`. The frame: Paper, On pastel text, square corners, the lift, and a tilt. The tilt is one custom property, so hover and pressed derive from it and the large-text variant turns it off in one place.

```tsx
export type Lean = 'left' | 'right';
type Frame = 'small' | 'large';

type PolaroidProps = { frame: Frame; lean: Lean; children: ReactNode };

// small: list polaroids, whose caption brings its own bottom padding; large: the recipe's photo.
const frameStyles: Record<Frame, string> = { small: 'px-2 pt-2', large: 'p-2.5' };
const leanStyles: Record<Lean, string> = { left: '[--tilt:-3deg]', right: '[--tilt:3deg]' };

// group-* answers to a Polaroid card's link; a polaroid outside a card has no group and never moves.
export const Polaroid = ({ frame, lean, children }: PolaroidProps) => (
  <div
    className={cn(
      'flex flex-col bg-paper text-on-pastel shadow-lift transition rotate-(--tilt) large-text:[--tilt:0deg]',
      'group-hover:-translate-y-1 group-hover:rotate-[calc(var(--tilt)/3)] group-hover:shadow-lift-hover',
      'group-active:scale-98 group-active:rotate-[calc(var(--tilt)*2/3)] group-active:shadow-lift-pressed',
      frameStyles[frame],
      leanStyles[lean]
    )}
  >
    {children}
  </div>
);
```

With a 3 degree lean, hover rests at 1 degree and pressed at 2 (the board's `rotate(-1deg) translateY(-4px)` and `rotate(-2deg) scale(0.98)`). `transition` uses the default 120 ms ease-out, and reduced motion already turns it off (`picnic.css:154-163`). Export `Polaroid` and `type Lean` from `frontend/src/dino/index.ts`.

### Photo fillers (part 1)

New `frontend/src/dino/photo-filler.tsx`, replacing `cuisine-plate.tsx`. One unit per filler and a picker; both are decorative (`aria-hidden="true"`) and carry `data-filler`, the only handle a test has on a drawing.

```tsx
type Shape = 'card' | 'hero';
type Filler = 'place-setting' | 'rug';

// Recipe IDs are sequential, so neighbours in the catalogue tend to differ.
const fillerFor = (recipeId: number): Filler => (recipeId % 2 === 0 ? 'place-setting' : 'rug');

export const PhotoFiller = ({ recipeId, shape }: { recipeId: number; shape: Shape }) => { … };
```

- **Shape:** `card` is `aspect-4/3`, `hero` is `aspect-7/5`, on `bg-paper`, full width.
- **Place setting:** a `div` with `data-filler="place-setting"`, a 2 px dashed border in `border-on-pastel/28`, centring an SVG at `w-[58%] h-auto`. The SVG is the board's: `viewBox="0 0 96 64"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="2.5"`, round caps and joins; `<circle cx="48" cy="34" r="22" />`, `<circle cx="48" cy="34" r="14" strokeOpacity="0.45" />`, `<path d="M14 12v12a5 5 0 0 0 10 0V12M19 12v44M80 12c-5 3-6 12-6 18h6v26" />`. It inherits On pastel from the frame.
- **Rug:** an SVG with `data-filler="rug"`, `viewBox="0 0 140 100"`, `preserveAspectRatio="xMidYMid slice"`, `className="block w-full"` in the shape's aspect. A `<pattern>` (id from `useId()`, `patternUnits="userSpaceOnUse"`, 16 × 16) holds two rects in `currentColor` at `fillOpacity="0.13"`: `x=0 y=0 width=8 height=16` and `x=0 y=0 width=16 height=8`, so their overlap reads as gingham. A full-size rect fills Paper (`fill="var(--color-paper)"`), one more fills with the pattern, then the plate: a drawn shadow `<circle cx="70" cy="52" r="21" fill="currentColor" fillOpacity="0.15" />`, the plate `<circle cx="70" cy="50" r="20" fill="var(--color-paper)" />` and its rim `<circle cx="70" cy="50" r="14" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="2" />`.

Neither uses a pastel or a CSS shadow. Not exported from `index.ts`: only `RecipePhoto` uses it.

### RecipePhoto (part 1)

Edit `frontend/src/dino/recipe-photo.tsx`:

```tsx
type RecipePhotoProps = {
  photo: Photo | null;
  recipeId: number;
  shape: Shape;
  alt: string;
  caption?: ReactNode;
};
```

- `cuisineSlug` goes; `recipeId` picks the filler. The fallback renders `<PhotoFiller recipeId={recipeId} shape={shape} />`.
- `hero` becomes `aspect-7/5`. The `sizes` follow the polaroid's photo width (the page's content less the frame):
  - `card`: `'(width < 17.5em) calc(100vw - 3rem), (min-width: 42rem) 18.5rem, calc(50vw - 2.5rem)'`, loading `lazy`, or `eager` with `fetchPriority="high"` when `eager` is set: the list sets it on its first row (the first two cards).
  - `hero`: `'(min-width: 42rem) 38.75rem, calc(100vw - 3.25rem)'`, loading `eager`.
- The `figcaption` loses `text-muted` (Muted on Paper fails 1.4.3) and becomes `break-words pt-2 text-small`, inheriting On pastel from the frame. The `figure` loses its `gap-2`. A caption still shows only beside a loaded photo, so a failed photo drops its credit.

### PolaroidCard (part 1)

New `frontend/src/dino/polaroid-card.tsx`, replacing `recipe-card.tsx`. The whole card is the link (the board's `<a class="card">`), so it clears the 44 px target check without padding the caption. The link takes its name from the caption and its description from the meta.

```tsx
type PolaroidCardProps = {
  title: string;
  to: string;
  recipeId: number;
  photo: Photo | null;
  lean: Lean;
  children?: ReactNode; // the meta line
};
```

```tsx
<Link
  to={to}
  aria-labelledby={captionId}
  aria-describedby={children ? metaId : undefined}
  className="group flex flex-col gap-3 text-ink no-underline focus-visible:outline-3 focus-visible:outline-ink focus-visible:outline-offset-8"
>
  <Polaroid frame="small" lean={lean}>
    {/* The caption names the link, so the photo adds nothing for a screen reader. */}
    <RecipePhoto shape="card" photo={photo} recipeId={recipeId} alt="" />
    <h2 id={captionId} className="break-words px-0.5 pt-1 pb-2 text-caption">{title}</h2>
  </Polaroid>
  {children && <div id={metaId} className="pl-1 text-muted text-small">{children}</div>}
</Link>
```

- Ids from `useId()`. The `h2` keeps the base serif italic; `text-caption` sets Caption's 21/22 size.
- The ring is square (no radius) and stands 8 px off, as drawn, so it clears the tilted corners; the link itself never tilts.
- `cursor-pointer` comes with the link. Large text needs nothing more here: the list goes to one column and the polaroid's tilt turns off.

Export `PolaroidCard` from `index.ts`; delete the `RecipeCard`, `CuisinePlate` exports.

### Recipe list (part 1)

Edit `frontend/src/recipes/recipes-page.tsx`:

- `RecipeItem` takes `lean` and renders `<PolaroidCard title to recipeId={recipe.id} photo={recipe.photo} lean={lean}><RecipeMeta recipe={recipe} /></PolaroidCard>`. The description and the diet tags leave the card; `Tag` and `dietTagLabels` imports go from this file.
- `Recipes` maps with the index: `lean={index % 2 === 0 ? 'left' : 'right'}`.
- The list becomes `<ul className="grid grid-cols-2 gap-x-4 gap-y-8 large-text:grid-cols-1">`.

### Recipe page (part 1)

Edit `frontend/src/recipes/recipe-page.tsx:280-286`:

```tsx
<Polaroid frame="large" lean="left">
  <RecipePhoto
    shape="hero"
    photo={recipe.photo}
    recipeId={recipe.id}
    alt={recipe.title}
    caption={recipe.photo && <RecipePhotoCredit photo={recipe.photo} />}
  />
</Polaroid>
```

The Tags stay until part 2. In `frontend/src/recipes/recipe-photo-credit.tsx`, the link takes `className="text-on-pastel decoration-on-pastel focus-visible:outline-on-pastel"`, since the base link's Ink text, Field underline and Ink ring vanish on Paper.

### 200% text in the screenshots (part 1)

The variant answers to the viewport, so a story can't fake it from inside the page. Edit `frontend/playwright.visual.config.ts`: the `phone` project gets `grepInvert: /› Large Text$/`, and a second project shoots only those stories as a 390 × 844 phone at 200%:

```ts
{
  name: 'phone at 200% text',
  grep: /› Large Text$/,
  use: { ...devices['Desktop Chrome'], viewport: { width: 195, height: 422 }, deviceScaleFactor: 2 },
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'device', maxDiffPixels: 4 } }
}
```

A story named `LargeText` has the test title `<title> › Large Text`. The baseline name stays `${id}.png`, so `stories.spec.ts` and `update-visual-baselines.ts` need no change. Add a one-line comment on the project saying why it exists.

### Stories and boards (part 1)

The photo in stories is the data-URI SVG already used in `recipe-photo.stories.tsx:6-7`. Story names follow the board.

- New `frontend/src/dino/polaroid-card.stories.tsx`, title `Dino/PolaroidCard`, wrapped in `MemoryRouter` (mirror `recipe-card.stories.tsx`), args `title: 'Bibimbap'`, `to: '/recipes/bibimbap'`, `recipeId: 3`, a photo, `lean: 'left'`, children `<p className="tabular-nums">35 min · Easy · Korean</p>`. Stories: `Default` (play: the link named "Bibimbap" has `href="/recipes/bibimbap"` and the description "35 min · Easy · Korean"), `LeansRight`, `IsHover`, `IsPressed`, `IsFocus` (`pseudo: { focusVisible: ['a'] }`), `PlaceSetting` (`photo: null, recipeId: 2, title: 'Shakshuka'`), `Rug` (`photo: null, recipeId: 1, title: 'Ribollita'`), `LargeText`.
- New `frontend/src/dino/polaroid.stories.tsx`, title `Dino/Polaroid`, rendering a `large` left-leaning Polaroid round a hero `RecipePhoto`: `Hero` (a photo and the caption `Photo by A. Cook, CC BY-SA 4.0`), `HeroWithoutPhoto` (`photo: null`, `recipeId: 2`), `LargeText` (the `Hero` args).
- Edit `frontend/src/dino/recipe-photo.stories.tsx`: args swap `cuisineSlug` for `recipeId: 3`. Keep `Card`, `Hero`; replace `CardWithoutPhoto` with `PlaceSetting` (`photo: null, recipeId: 2`) and `Rug` (`photo: null, recipeId: 1`); delete `HeroWithCaption` (the Polaroid's `Hero` shows the credit); `BrokenPhoto`'s play asserts the `img` is gone and `[data-filler="rug"]` is there.
- Delete `recipe-card.stories.tsx`, `cuisine-plate.stories.tsx`, `recipe-card.tsx`, `cuisine-plate.tsx`.
- `frontend/src/dino/boards.ts`: replace `Dino/RecipeCard` and `Dino/CuisinePlate` with `Dino/PolaroidCard` and `Dino/Polaroid`, both `docs/design/dino/polaroids.dc.png`.

### Docs (part 1)

- `docs/design.md:111`, Shadows: after the lift, add "On a polaroid card the lift rises under the pointer (`0 18px 36px rgb(0 0 0 / 0.42)`) and settles while pressed (`0 6px 14px rgb(0 0 0 / 0.35)`)."
- `docs/design.md:146`, Stickers: "in pink, mint or butter" becomes "pink for diet tags, butter for a featured recipe's time".
- `GLOSSARY.md`: Photo becomes "7:5 at the top of its page, 4:3 in its polaroid card"; Photo credit becomes "shown inside its polaroid's frame on the recipe's page"; Cuisine plate is replaced by **Photo filler**: "The place setting or gingham rug drawn in a recipe's polaroid where it has no photo, picked from the recipe's ID." with code `PhotoFiller`.
- `frontend/scripts/dino-bundle.ts:146-153`: drop the `cuisine-` filter and usage branch; colours are `color-` tokens only.

### Sticker (part 2)

New `frontend/src/dino/sticker.tsx`, replacing `tag.tsx`. A `span`, never interactive.

```tsx
type StickerKind = 'diet' | 'time';
export type StickerItem = { label: string; kind: StickerKind };

const kindStyles: Record<StickerKind, string> = {
  diet: 'bg-pink px-2.5 py-1.5',
  time: 'min-h-16 min-w-16 justify-center bg-butter p-2 text-center'
};

export const Sticker = ({ label, kind, lean }: StickerItem & { lean: Lean }) => (
  <span className={cn(
    'inline-flex items-center rounded-pill border-2 border-transparent text-small font-extrabold text-on-pastel',
    lean === 'left' ? '-rotate-8' : 'rotate-8',
    'large-text:rotate-0',
    kindStyles[kind]
  )}>{label}</span>
);
```

Small at weight 800 is the board's `800 13px/16px`. The transparent border lets forced colours outline it. `time` is the featured recipe's butter circle; nothing uses it until a featured recipe exists, but the board draws it and the Sticker row in `docs/design.md` names it.

`StickeredPhoto`, in the same file, lays stickers on a polaroid: the first two on the photo, the rest below, and all below at large text. It's a grid, so the stickers on the photo share the polaroid's cell:

```tsx
type StickeredPhotoProps = { stickers: StickerItem[]; children: ReactNode }; // children: the Polaroid
```

- The wrapper: `grid grid-cols-1 gap-3 large-text:flex large-text:flex-wrap large-text:gap-2`. The polaroid sits in `col-start-1 row-start-1 large-text:w-full`.
- Sticker 1: `col-start-1 row-start-1 z-10 self-end justify-self-start -translate-x-2 -translate-y-8`, lean left. Sticker 2: `col-start-1 row-start-1 z-10 self-start justify-self-end translate-x-2 translate-y-8`, lean right. Both take `large-text:translate-0`.
- The rest: a `div` in `row-start-2 flex flex-wrap gap-2 large-text:contents`, each sticker leaning left then right.
- The stickers stay `span`s in reading order after the photo, so a screen reader reads "Vegan, Gluten-free" after the image. The 8 px overhang stays inside the page's 16 px gutter.

Export `Sticker`, `StickeredPhoto` and `type StickerItem` from `index.ts`; delete the `Tag` export, `tag.tsx`, `tag.stories.tsx` and `frontend/visual/baselines/dino-tag--default.png`. `boards.ts`: replace `Dino/Tag` with `Dino/Sticker` (`docs/design/dino/polaroids.dc.png`).

### Recipe page (part 2)

- New `stickerTags(tags: DietTag[]): DietTag[]` in `frontend/src/recipes/diet-tags.ts`: with `vegan`, drop `vegetarian` and `dairy_free`; keep the API's order otherwise.
- `recipe-page.tsx`: the Polaroid goes inside `<StickeredPhoto stickers={stickerTags(recipe.diet_tags).map((tag) => ({ label: dietTagLabels[tag], kind: 'diet' }))}>`.
- Under the `h1`, before the description: `<p className="text-muted">{[difficultyLabels[recipe.difficulty], ...(recipe.one_pot ? ['One-pot'] : [])].join(' · ')}</p>`.
- The Tag list (`recipe-page.tsx:289-303`) and the `Tag` import go. The diet tag conflicts stay as they are.

## Decisions

- **Two PRs, polaroids then stickers**, because one PR is about 25 files and 25 baselines; part 1 is the frame, the fillers and both pages, part 2 is small and builds on it. Asked: Split into two PRs? → Two parts.
- **Diet stickers are all pink; butter is for a featured recipe's time; no mint sticker**, because `docs/design.md` gives mint to chosen and done. Part 1 fixes line 146, which said "pink, mint or butter". Asked: Diet sticker colour? → All pink, and fix line 146 to say pink for diet tags, butter for a featured recipe's time.
- **Vegan hides vegetarian and dairy-free; two on the photo, the rest below**, because vegan implies both, so only a vegetarian, gluten-free and dairy-free recipe still has three, and none is hidden. Asked: More than two diet tags? → Skip implied, rest below.
- **Difficulty and one-pot become a muted line under the title**, because stickers are only for diet tags and time; TAS-83 (page layouts) folds them into the description as drawn. Asked: Where do difficulty and one-pot go? → A line under the title.
- **A list polaroid shows only its meta**, as drawn; the description and diet tags stay on the recipe's page and in the Diet filter. Asked: What does a list polaroid show? → Meta only, as drawn.
- **Large text is a CSS media query on width in em (`width < 17.5em`)**, because zoom narrows the viewport in CSS px and em follows the browser's text size, with no script. A laptop at 200% zoom keeps its tilt. Asked: How is large text detected? → Width in em (CSS only).
- **The list's first row of photos loads eagerly, with high fetch priority**, because lazy loading held back the list's largest paint and the preview's Lighthouse performance fell to 87. Asked: review → Load the first row eagerly: fix the cause now rather than re-running.
- **The whole Polaroid card is the link, named by `aria-labelledby` from its caption**, because the board draws the card as one link, and a link round only the 22 px caption would fail the 44 px target check or stretch the caption. (agent)
- **The link wraps only the polaroid, and its `::after` stretches over the meta**, because axe's label in name rule (`label-content-name-mismatch`) fails a link named by `aria-labelledby` when it also holds the meta's visible text. The card is still one link named by its caption and described by its meta, and the ring sits on the card's wrapper (`has-focus-visible`). Found during the build. (agent)
- **The focus ring stands 8 px off the card, square**, as the board draws it, so it clears the tilted corners; the flush-ring rule is about pills. (agent)
- **The tilt is one custom property (`--tilt`)**, because hover (a third), pressed (two thirds) and large text (zero) all derive from it; one class per state per lean would repeat the angles. (agent)
- **Two shadow tokens for the card's hover and pressed lift**, because the board draws them and literal shadows aren't allowed; `docs/design.md`'s Shadows line names them. (agent)
- **Fillers are SVG, picked by ID parity**, because the plate's shadow is part of the drawing (not a CSS shadow, which only polaroids may have), and parity makes neighbours differ with sequential IDs. (agent)
- **200% text is shot by its own Playwright project**, at 195 × 422 CSS px and 2× scale, because the variant answers to the viewport and a story can't change it. (agent)
- **The credit link is On pastel on the frame, with an On pastel ring**, because the base link's Ink text and ring vanish on Paper. (agent)
- **Stickers lay out with `StickeredPhoto` in Dino**, because "two at most on a photo, below at large text" is a design-system rule, not a page's. (agent)

## Blast radius

- `RecipePhoto`'s props change (`cuisineSlug` out, `recipeId` in): its only users are `recipe-card.tsx` (deleted), `recipe-page.tsx` and its stories. `tsc -b` finds any other.
- `RecipeCard`, `CuisinePlate` and (part 2) `Tag` leave `frontend/src/dino/index.ts`: used only in `recipes-page.tsx`, `recipe-page.tsx` and their stories (`grep -rn "RecipeCard\|CuisinePlate\|Tag\b" frontend/src`).
- The `--cuisine-*` variables are read only by `cuisine-plate.tsx` and `dino-bundle.ts`. Run `pnpm --filter frontend dino:bundle` after the change to check the bundle still builds.
- The `large-text` variant and the shadow tokens are new; nothing else changes.
- The visual config's new project changes only which project shoots the `Large Text` stories; check `pnpm --filter frontend test:visual` lists every other story once, under `phone`.
- `frontend/e2e/phone-width.spec.ts:141` expects "Dairy-free" on the list, which part 1 removes from the card.

## Out of scope

- The page layouts: the list's title, squiggle, doodle, three and four a row, the featured polaroid and its tape, and the recipe page's columns and blobs (TAS-83 (page layouts)).
- Tilted filter chips and their wrap at large text (TAS-83).
- Loading as blank polaroids and the empty state's dashed polaroid (`docs/design.md`, States and Components).
- Tape on any polaroid: only a featured one carries it, and nothing is featured yet.
- A featured recipe and its time sticker on a page; part 2 builds the sticker only.
- Backend and API: no change.

## Steps

### Part 1

1. **Tokens and the large-text variant.** `frontend/src/dino/picnic.css` (edit)
   Add the two shadow tokens and the `large-text` variant; delete the `--cuisine-*` block. `frontend/scripts/dino-bundle.ts` (edit): drop the cuisine branch.
   Done when: `pnpm lint` passes and `pnpm --filter frontend dino:bundle` runs.
2. **Photo fillers.** `frontend/src/dino/photo-filler.tsx` (new), `frontend/src/dino/cuisine-plate.tsx` and `cuisine-plate.stories.tsx` (delete)
   Done when: `tsc -b` passes once step 3 is in.
3. **RecipePhoto.** `frontend/src/dino/recipe-photo.tsx`, `recipe-photo.stories.tsx` (edit)
   `recipeId` for `cuisineSlug`, the filler fallback, 7:5 hero, new `sizes`, the On pastel caption.
   Done when: the RecipePhoto stories pass in `pnpm test`.
4. **Polaroid and Polaroid card.** `frontend/src/dino/polaroid.tsx`, `polaroid.stories.tsx`, `polaroid-card.tsx`, `polaroid-card.stories.tsx` (new), `recipe-card.tsx`, `recipe-card.stories.tsx` (delete), `index.ts`, `boards.ts` (edit)
   Done when: the new stories pass axe, the 44 px check and their plays in `pnpm test`.
5. **Both pages.** `frontend/src/recipes/recipes-page.tsx`, `recipe-page.tsx`, `recipe-photo-credit.tsx` (edit), with their tests (below) and `frontend/e2e/phone-width.spec.ts` (edit: the list test drops "Dairy-free" and checks the caption "Slow-roasted pork shoulder with crackling, apple sauce and Yorkshire puddings" is visible).
   Done when: `pnpm test` passes and `pnpm test:e2e` passes, including axe on both pages.
6. **The 200% project.** `frontend/playwright.visual.config.ts` (edit)
   Done when: `pnpm --filter frontend exec playwright test -c playwright.visual.config.ts --list` shows the three `Large Text` stories under `phone at 200% text` and none under `phone`.
7. **Docs.** `docs/design.md`, `GLOSSARY.md` (edit)
   Done when: the lines in Docs (part 1) read as written.
8. **Baselines.** `frontend/visual/baselines/` (edit)
   Follow `specs/lessons/factory-runs-make-baselines-in-place.md`: build Storybook, run the whole suite to see only the expected stories fail, then `--update-snapshots=changed` for `Dino/PolaroidCard`, `Dino/Polaroid` and `Dino/RecipePhoto`. Delete `dino-recipecard--*.png`, `dino-cuisineplate--*.png`, `dino-recipephoto--card-without-photo.png` and `dino-recipephoto--hero-with-caption.png`. Look at each new shot against the board.
   Done when: `pnpm --filter frontend test:visual` passes, with no orphan baselines.

### Part 2

1. **Sticker and StickeredPhoto.** `frontend/src/dino/sticker.tsx`, `sticker.stories.tsx` (new), `tag.tsx`, `tag.stories.tsx` (delete), `index.ts`, `boards.ts` (edit)
   Stories, title `Dino/Sticker`: `Diet` ("Vegan"), `DietLeansRight` ("Gluten-free"), `Time` ("25 min"), `OnAPolaroid` (a hero Polaroid with Vegan and Gluten-free), `ThreeStickers` (Vegetarian, Gluten-free, Dairy-free), `LargeText` (`OnAPolaroid`'s args).
   Done when: the stories pass in `pnpm test`.
2. **stickerTags.** `frontend/src/recipes/diet-tags.ts` (edit), `diet-tags.test.ts` (new)
   Done when: its table test passes.
3. **Recipe page.** `frontend/src/recipes/recipe-page.tsx`, `recipe-page.test.tsx` (edit)
   Done when: `pnpm test` and `pnpm test:e2e` pass.
4. **Baselines.** Make the `Dino/Sticker` baselines as in part 1's step 8 and delete `dino-tag--default.png`.
   Done when: `pnpm --filter frontend test:visual` passes.

### Tests

**Part 1**

- `frontend/src/recipes/recipes-page.test.tsx`
  - Replace "shows each recipe's total time, difficulty and cuisines on its card" and "shows each recipe's diet tags on its card": with `appleTart` given `diet_tags: ['vegetarian', 'gluten_free']`, and Ramen tacos, asserts: Apple tart's `li` has the text `/^Apple tart1 hr 40 min · Medium · French$/` (no description, no diet tags) and Ramen tacos' `/^Ramen tacos25 min · Easy · Japanese, Mexican$/`.
  - "loads the first row's photos at once and the rest lazily, at the card width", asserts: the `sizes` is `(width < 17.5em) calc(100vw - 3rem), (min-width: 42rem) 18.5rem, calc(50vw - 2.5rem)`, with the same `srcset`; the first card's photo is `eager` and `fetchpriority="high"`, the third's `lazy` and `auto`.
  - New: "names each card's link by the recipe and describes it by its meta", asserts: `getByRole('link', { name: 'Apple tart' })` has the accessible description `1 hr 40 min · Medium · French` and `href="/recipes/apple-tart"`.
  - New, `it.each`: "draws the place setting or the rug for a recipe without a photo, by its ID", cases `[1, 'rug']`, `[2, 'place-setting']`, `[4, 'place-setting']`, asserts: the card's `[data-filler]` has that value.
- `frontend/src/recipes/recipe-page.test.tsx`
  - "loads the photo at once at the page width…", asserts: `sizes` is `(min-width: 42rem) 38.75rem, calc(100vw - 3.25rem)`; the rest as today.
  - Replace "shows the cuisine plate without a credit when the photo can't load" with "shows the rug without a credit when the photo can't load" (Shakshuka, ID 7), asserts: after `fireEvent.error`, no `img`, no text `/Photo by/`, and one `[data-filler="rug"]`, where before the error there was a `figure`.
  - "shows a photo above the title only when the recipe has one" stays as it is: the filler isn't an image.
- `frontend/e2e/phone-width.spec.ts`: the list test, asserts: the long title is visible and `sidewaysScroll` is 0.
- The stories' plays (above) and the visual suite: every new story's baseline.

**Part 2**

- `frontend/src/recipes/diet-tags.test.ts` (new), `it.each` on `stickerTags`:
  - `['vegetarian', 'vegan', 'dairy_free']`, asserts: `['vegan']`.
  - `['vegetarian', 'vegan', 'gluten_free', 'dairy_free']`, asserts: `['vegan', 'gluten_free']`.
  - `['vegetarian', 'gluten_free', 'dairy_free']`, asserts: the same three.
  - `['dairy_free']`, asserts: `['dairy_free']`.
  - `[]`, asserts: `[]`.
- `frontend/src/recipes/recipe-page.test.tsx`
  - Replace "shows the diet tags %j…": the cases' `shownTags` follow `stickerTags`, read as the text of the spans after the photo's `figure`, in order; the sentences as today.
  - Replace the `tags()` asserts in "shows the recipe's difficulty, one-pot…" and the Hard case, asserts: the paragraph after the `h1` is `Easy · One-pot`, and `Hard` for a recipe that isn't one-pot.
  - "shows a description line only when the recipe has one", asserts: `paragraphs()` is `['Medium', 'Sharp apples on buttery pastry.']` for apple-tart and `['Easy']` for banana-bread (the default handlers' fixtures in `src/test/handlers.ts`).
  - New: "shows no sticker as a button or a link", asserts: with `diet_tags: ['vegan']`, the text "Vegan" is shown and `queryByRole('button', { name: 'Vegan' })` and `queryByRole('link', { name: 'Vegan' })` are null.

**Checks (both parts):** `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm --filter frontend build-storybook` then `pnpm --filter frontend test:visual`.

## Assumptions

- **Two polaroids a row on phones**, from `docs/design.md`'s Layout table, since a full-width polaroid at normal text is far bigger than the board's; TAS-83 adds three and four a row. Confirm with: Milo at spec approval.
- **Lean is 3 degrees, alternating by position; the recipe's polaroid leans left.** The board varies between 2 and 4; one value keeps the rows tidy. Confirm with: Milo at spec approval.
- **Even IDs get the place setting, odd the rug.** Either way round meets the rule. Confirm with: Milo at spec approval.
- **The time sticker is built and storied but unused** until a featured recipe exists. Confirm with: Milo at spec approval.

## Validation criteria

- [ ] `pnpm lint` and `pnpm test` pass.
- [ ] `pnpm test:e2e` passes, axe included, on `/recipes` and a recipe's page.
- [ ] `pnpm --filter frontend test:visual` passes; the new baselines match `polaroids.dc.png`, and no baseline is orphaned.
- [ ] On the preview, at 200% phone zoom, polaroids sit straight and the list is one column.
- Evidence: feature — a laptop shot of the recipe list; phone shots of the list, a recipe with a photo, a recipe without one, and the list at 200% text; the walkthrough.
