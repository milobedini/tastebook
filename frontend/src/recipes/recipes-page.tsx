import { CookingPot } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import type { components } from '../api/schema';
import { Banner, Button, EmptyState, Field, NativeSelect, Page, RecipeCard, SearchInput } from '../ui';
import { useCuisines } from './cuisines-api';
import { difficultyLabels } from './difficulty';
import { formatMinutes } from './format-minutes';
import type { RecipeFilters } from './recipes-api';
import { useRecipes } from './recipes-api';
import { useDebouncedValue } from './use-debounced-value';

type Cuisine = components['schemas']['Cuisine'];
type RecipeSummary = components['schemas']['RecipeSummary'];

const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 3;

// Shorter terms would match most of the list, so they search nothing and show it all.
const toSearchTerm = (text: string) => {
  const term = text.trim();
  return term.length >= MIN_SEARCH_LENGTH ? term : '';
};

// Each control writes its own parameter and keeps the others, so the search and the cuisine combine.
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

type CuisineSelectProps = {
  cuisines: Cuisine[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

const CuisineSelect = ({ cuisines, value, onChange }: CuisineSelectProps) => {
  // A select can't show a value it has no option for, and the API ignores an unknown slug, so both say "All cuisines".
  const known = cuisines.some(({ slug }) => slug === value);
  return (
    <Field label="Cuisine">
      {(control) => (
        <NativeSelect {...control} value={known ? value : ''} onChange={onChange}>
          <option value="">All cuisines</option>
          {cuisines.map(({ slug, name }) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </NativeSelect>
      )}
    </Field>
  );
};

const CuisinesLoading = () => (
  <Field label="Cuisine">
    {(control) => (
      <NativeSelect {...control} disabled>
        <option>Loading cuisines…</option>
      </NativeSelect>
    )}
  </Field>
);

type CuisinesUnavailableProps = {
  onRetry: () => void;
};

const CuisinesUnavailable = ({ onRetry }: CuisinesUnavailableProps) => (
  <>
    <Banner tone="danger" title="The cuisines couldn't be loaded." />
    <Button variant="secondary" className="self-start" onClick={onRetry}>
      Load cuisines again
    </Button>
  </>
);

type CuisinePickerProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

const CuisinePicker = ({ value, onChange }: CuisinePickerProps) => {
  const { data: cuisines, isPending, refetch } = useCuisines();
  if (cuisines !== undefined) {
    return <CuisineSelect cuisines={cuisines} value={value} onChange={onChange} />;
  }
  // Refetching a query that has never succeeded resets it to pending, so "Load cuisines again" shows this too.
  if (isPending) {
    return <CuisinesLoading />;
  }
  return <CuisinesUnavailable onRetry={() => void refetch()} />;
};

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
    <RecipeCard title={recipe.title} to={`/recipes/${recipe.slug}`} cuisineSlug={recipe.cuisines[0]?.slug}>
      <RecipeMeta recipe={recipe} />
      {recipe.description !== '' && <p>{recipe.description}</p>}
    </RecipeCard>
  </li>
);

type NoRecipesProps = { searchTerm: string; cuisineName: string | undefined };

const NoRecipes = ({ searchTerm, cuisineName }: NoRecipesProps) => {
  const subject = cuisineName === undefined ? 'recipes' : `${cuisineName} recipes`;
  if (searchTerm === '') {
    return <EmptyState icon={CookingPot} title={`No ${subject} yet.`} />;
  }
  return <EmptyState icon={CookingPot} title={`No ${subject} match “${searchTerm}”.`} />;
};

type RecipeCountProps = { count: number };

const RecipeCount = ({ count }: RecipeCountProps) => (
  <p className="text-muted text-small">{`${count} ${count === 1 ? 'recipe' : 'recipes'}`}</p>
);

type RecipesProps = { recipes: RecipeSummary[]; searchTerm: string; cuisineName: string | undefined };

const Recipes = ({ recipes, searchTerm, cuisineName }: RecipesProps) => {
  if (recipes.length === 0) {
    return <NoRecipes searchTerm={searchTerm} cuisineName={cuisineName} />;
  }
  return (
    <>
      <RecipeCount count={recipes.length} />
      <ul className="grid gap-4">
        {recipes.map((recipe) => (
          <RecipeItem key={recipe.id} recipe={recipe} />
        ))}
      </ul>
    </>
  );
};

type RecipeListProps = { filters: RecipeFilters };

const RecipeList = ({ filters }: RecipeListProps) => {
  const { data, isPending, refetch } = useRecipes(filters);
  const { data: cuisines } = useCuisines();
  // A list already shown stays up if a background refetch fails.
  if (data !== undefined) {
    return (
      <Recipes
        recipes={data.recipes}
        searchTerm={data.filters.searchTerm}
        cuisineName={cuisines?.find(({ slug }) => slug === data.filters.cuisine)?.name}
      />
    );
  }
  // Refetching a query that has never succeeded resets it to pending, so "Try again" shows this too.
  if (isPending) {
    return <p>Loading recipes…</p>;
  }
  return <RecipesUnavailable onRetry={() => void refetch()} />;
};

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

  // The dropdown changes the address at once, so the address is its only state.
  const cuisine = searchParams.get('cuisine') ?? '';
  const handleCuisineChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSearchParams((params) => withParam(params, 'cuisine', event.target.value), { replace: true });
    },
    [setSearchParams]
  );

  return (
    <Page>
      <title>Recipes · Tastebook</title>
      <h1>Recipes</h1>
      {/* No form: results follow the typing and the dropdown, so Enter has nothing to submit. */}
      <search className="flex flex-col gap-4">
        <RecipeSearch value={searchText} onChange={handleSearchChange} />
        <CuisinePicker value={cuisine} onChange={handleCuisineChange} />
      </search>
      <RecipeList filters={{ searchTerm, cuisine }} />
      <Button asChild variant="ghost" className="self-start">
        <Link to="/">Back to Tastebook</Link>
      </Button>
    </Page>
  );
};
