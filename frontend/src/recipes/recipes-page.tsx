import { CookingPot, SlidersHorizontal } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import type { components } from '../api/schema';
import { Banner, Button, EmptyState, Field, Page, RecipeCard, SearchInput, Tag } from '../dino';
import { ActiveFilters } from './active-filters';
import { dietTagLabels } from './diet-tags';
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

// The search box writes only q and keeps the others, so the search and the filters combine.
const withParam = (params: URLSearchParams, name: string, value: string) => {
  const next = new URLSearchParams(params);
  if (value === '') {
    next.delete(name);
  } else {
    next.set(name, value);
  }
  return next;
};

type RecipeSearchProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const RecipeSearch = ({ value, onChange }: RecipeSearchProps) => (
  <Field label="Search recipes">{(control) => <SearchInput {...control} value={value} onChange={onChange} />}</Field>
);

type RecipesUnavailableProps = {
  onRetry: () => void;
};

const RecipesUnavailable = ({ onRetry }: RecipesUnavailableProps) => (
  <>
    <Banner tone="danger" title="The recipes couldn't be loaded." />
    <Button variant="secondary" className="self-start" onClick={onRetry}>
      Try again
    </Button>
  </>
);

type RecipeMetaProps = { recipe: RecipeSummary };

const RecipeMeta = ({ recipe }: RecipeMetaProps) => {
  const cuisineNames = recipe.cuisines.map(({ name }) => name).join(', ');
  const parts = [formatMinutes(recipe.total_minutes), difficultyLabels[recipe.difficulty], cuisineNames];
  return <p className="tabular-nums">{parts.filter((part) => part !== '').join(' · ')}</p>;
};

type RecipeItemProps = { recipe: RecipeSummary };

const RecipeItem = ({ recipe }: RecipeItemProps) => (
  <li>
    <RecipeCard
      title={recipe.title}
      to={`/recipes/${recipe.slug}`}
      cuisineSlug={recipe.cuisines[0]?.slug}
      photo={recipe.photo}
    >
      <RecipeMeta recipe={recipe} />
      {recipe.description !== '' && <p>{recipe.description}</p>}
      {recipe.diet_tags.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {recipe.diet_tags.map((tag) => (
            <li key={tag}>
              <Tag>{dietTagLabels[tag]}</Tag>
            </li>
          ))}
        </ul>
      )}
    </RecipeCard>
  </li>
);

type NoRecipesProps = { query: RecipeQuery; onClearFilters: () => void };

const NoRecipes = ({ query: { searchTerm, filters }, onClearFilters }: NoRecipesProps) => {
  if (!hasFilters(filters)) {
    const title = searchTerm === '' ? 'No recipes yet.' : `No recipes match “${searchTerm}”.`;
    return <EmptyState icon={CookingPot} title={title} />;
  }
  const title =
    searchTerm === '' ? 'No recipes match these filters.' : `No recipes match “${searchTerm}” with these filters.`;
  return (
    <EmptyState
      icon={CookingPot}
      title={title}
      action={
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      }
    />
  );
};

type RecipeCountProps = { count: number };

// A status message, so a screen reader hears the new count after each change; with none, the empty state says so.
const RecipeCount = ({ count }: RecipeCountProps) => (
  <p role="status" className={count === 0 ? 'sr-only' : 'text-muted text-small'}>
    {`${count} ${count === 1 ? 'recipe' : 'recipes'}`}
  </p>
);

type RecipesProps = { recipes: RecipeSummary[]; query: RecipeQuery; onClearFilters: () => void };

const Recipes = ({ recipes, query, onClearFilters }: RecipesProps) => (
  <>
    <RecipeCount count={recipes.length} />
    {recipes.length === 0 ? (
      <NoRecipes query={query} onClearFilters={onClearFilters} />
    ) : (
      <ul className="grid gap-4">
        {recipes.map((recipe) => (
          <RecipeItem key={recipe.id} recipe={recipe} />
        ))}
      </ul>
    )}
  </>
);

type RecipeListProps = { query: RecipeQuery; onClearFilters: () => void };

const RecipeList = ({ query, onClearFilters }: RecipeListProps) => {
  const { data, isPending, refetch } = useRecipes(query);
  // A list already shown stays up if a background refetch fails.
  if (data !== undefined) {
    return <Recipes recipes={data.recipes} query={data.query} onClearFilters={onClearFilters} />;
  }
  // Refetching a query that has never succeeded resets it to pending, so "Try again" shows this too.
  if (isPending) {
    return <p>Loading recipes…</p>;
  }
  return <RecipesUnavailable onRetry={() => void refetch()} />;
};

const FILTER_PANEL_ID = 'recipe-filters';

export const RecipesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // The box owns the text while the page is open; the address keeps a copy for reloads, sharing and Back.
  const [searchText, setSearchText] = useState(() => searchParams.get('q') ?? '');
  const searchTerm = toSearchTerm(useDebouncedValue(searchText, SEARCH_DELAY_MS));

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      setSearchText(text);
      setSearchParams((params) => withParam(params, 'q', text), { replace: true });
    },
    [setSearchParams]
  );

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
      {/* No form: results follow the typing and the chips, so Enter has nothing to submit. */}
      <search className="flex flex-col gap-4">
        <RecipeSearch value={searchText} onChange={handleSearchChange} />
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
      </search>
      <ActiveFilters filters={filters} onChange={removeFilters} />
      <RecipeList query={{ searchTerm, filters }} onClearFilters={clearFilters} />
      <Button asChild variant="ghost" className="self-start">
        <Link to="/">Back to Tastebook</Link>
      </Button>
    </Page>
  );
};
