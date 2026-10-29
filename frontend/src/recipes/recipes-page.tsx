import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import type { components } from '../api/schema';
import type { Lean } from '../dino';
import { Button, EmptyState, ErrorWithRetry, Loading, Page, PolaroidCard } from '../dino';
import { ActiveFilters } from './active-filters';
import { difficultyLabels } from './difficulty';
import { formatMinutes } from './format-minutes';
import { RecipeFilterPanel } from './recipe-filter-panel';
import type { RecipeFilters } from './recipe-filters';
import { hasFilters, noFilters, readFilters, writeFilters } from './recipe-filters';
import type { RecipeQuery } from './recipes-api';
import { useRecipes } from './recipes-api';
import { useDebouncedValue } from './use-debounced-value';

type RecipeSummary = components['schemas']['RecipeSummary'];

const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 3;

// Shorter terms would match most of the list, so they search nothing and show it all.
const toSearchTerm = (text: string) => {
  const term = text.trim();
  return term.length >= MIN_SEARCH_LENGTH ? term : '';
};

type RecipeMetaProps = { recipe: RecipeSummary };

const RecipeMeta = ({ recipe }: RecipeMetaProps) => {
  const cuisineNames = recipe.cuisines.map(({ name }) => name).join(', ');
  const parts = [formatMinutes(recipe.total_minutes), difficultyLabels[recipe.difficulty], cuisineNames];
  return <p className="tabular-nums">{parts.filter((part) => part !== '').join(' · ')}</p>;
};

type RecipeItemProps = { recipe: RecipeSummary; lean: Lean; eager: boolean };

const RecipeItem = ({ recipe, lean, eager }: RecipeItemProps) => (
  <li>
    <PolaroidCard
      title={recipe.title}
      to={`/recipes/${recipe.slug}`}
      recipeId={recipe.id}
      photo={recipe.photo}
      lean={lean}
      eager={eager}
    >
      <RecipeMeta recipe={recipe} />
    </PolaroidCard>
  </li>
);

type NoRecipesProps = { query: RecipeQuery; onClearFilters: () => void };

const NoRecipes = ({ query: { searchTerm, filters }, onClearFilters }: NoRecipesProps) => {
  if (!hasFilters(filters)) {
    if (searchTerm === '') {
      return <EmptyState title="No recipes yet.">Recipes show here once they're in the catalogue.</EmptyState>;
    }
    return (
      <EmptyState title={`No recipes match “${searchTerm}”.`}>
        Nothing in the catalogue mentions it. Try another word.
      </EmptyState>
    );
  }
  const title =
    searchTerm === '' ? 'No recipes match these filters.' : `No recipes match “${searchTerm}” with these filters.`;
  return (
    <EmptyState
      title={title}
      action={
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      }
      doodle="one fewer?"
    >
      Nothing in the catalogue has all of them. Try removing a filter.
    </EmptyState>
  );
};

type RecipeCountProps = { count: number };

// A status message, so a screen reader hears the new count after each change; with none, the empty state says so.
const RecipeCount = ({ count }: RecipeCountProps) => (
  <p role="status" className={count === 0 ? 'sr-only' : 'text-muted text-small'}>
    {`${count} ${count === 1 ? 'recipe' : 'recipes'}`}
  </p>
);

// The first row is in view as the list opens and holds its largest paint, so its photos skip lazy loading.
const FIRST_ROW_LENGTH = 2;

type RecipesProps = { recipes: RecipeSummary[]; query: RecipeQuery; onClearFilters: () => void };

const Recipes = ({ recipes, query, onClearFilters }: RecipesProps) => (
  <>
    <RecipeCount count={recipes.length} />
    {recipes.length === 0 ? (
      <NoRecipes query={query} onClearFilters={onClearFilters} />
    ) : (
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 large-text:grid-cols-1">
        {recipes.map((recipe, index) => (
          <RecipeItem
            key={recipe.id}
            recipe={recipe}
            lean={index % 2 === 0 ? 'left' : 'right'}
            eager={index < FIRST_ROW_LENGTH}
          />
        ))}
      </ul>
    )}
  </>
);

type RecipeListProps = { query: RecipeQuery; onClearFilters: () => void };

const RecipeList = ({ query, onClearFilters }: RecipeListProps) => {
  const { data, isPlaceholderData, errorUpdatedAt, refetch } = useRecipes(query);
  // A refetch resets a never-successful query to pending but leaves errorUpdatedAt, so the error stays up through its
  // retry, even when an earlier query's list would otherwise stand in as placeholder data.
  const hasFailed = errorUpdatedAt > 0;
  // A list already shown stays up if a background refetch fails.
  if (data !== undefined && !(isPlaceholderData && hasFailed)) {
    return <Recipes recipes={data.recipes} query={data.query} onClearFilters={onClearFilters} />;
  }
  if (hasFailed) {
    return (
      <ErrorWithRetry title="Couldn't load recipes" onRetry={refetch}>
        Check your connection, then try again.
      </ErrorWithRetry>
    );
  }
  return <Loading>Finding recipes…</Loading>;
};

const FILTER_PANEL_ID = 'recipe-filters';

export const RecipesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // The top bar's field writes q (useRecipeSearch); the list searches once the typing pauses.
  const searchTerm = toSearchTerm(useDebouncedValue(searchParams.get('q') ?? '', SEARCH_DELAY_MS));

  // The chips change the address at once, so the address is the filters' only state.
  const filters = readFilters(searchParams);
  const changeFilters = useCallback(
    (next: RecipeFilters) => {
      // Each change builds on the filters last rendered, so it renders at once, not in a transition a second tap could overtake.
      setSearchParams((params) => writeFilters(params, next), { replace: true, flushSync: true });
    },
    [setSearchParams]
  );

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const filtersButton = useRef<HTMLButtonElement>(null);
  // The pressed chip or "Clear filters" disappears, so focus goes back to the Filters button.
  const removeFilters = useCallback(
    (next: RecipeFilters) => {
      changeFilters(next);
      filtersButton.current?.focus();
    },
    [changeFilters]
  );
  const clearFilters = useCallback(() => removeFilters(noFilters), [removeFilters]);

  return (
    <Page>
      <title>Recipes · Tastebook</title>
      <h1>Recipes</h1>
      <div className="flex flex-col gap-4">
        <Button
          ref={filtersButton}
          variant="secondary"
          className="self-start"
          aria-expanded={isPanelOpen}
          aria-controls={FILTER_PANEL_ID}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filters
        </Button>
        {isPanelOpen && <RecipeFilterPanel id={FILTER_PANEL_ID} filters={filters} onChange={changeFilters} />}
      </div>
      <ActiveFilters filters={filters} onChange={removeFilters} />
      <RecipeList query={{ searchTerm, filters }} onClearFilters={clearFilters} />
    </Page>
  );
};
