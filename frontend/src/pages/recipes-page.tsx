import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { useCuisines } from '../api/cuisines';
import type { RecipeFilters } from '../api/recipes';
import { useRecipes } from '../api/recipes';
import type { components } from '../api/schema';
import { RecipeCuisines } from '../components/recipe-cuisines';
import { useDebouncedValue } from '../hooks/use-debounced-value';

type Cuisine = components['schemas']['Cuisine'];
type Recipe = components['schemas']['Recipe'];

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
  <label>
    Search recipes <input type="search" value={value} onChange={onChange} />
  </label>
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
    <label>
      Cuisine{' '}
      <select value={known ? value : ''} onChange={onChange}>
        <option value="">All cuisines</option>
        {cuisines.map(({ slug, name }) => (
          <option key={slug} value={slug}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
};

const CuisinesLoading = () => (
  <label>
    Cuisine{' '}
    <select disabled>
      <option>Loading cuisines…</option>
    </select>
  </label>
);

type CuisinesUnavailableProps = {
  onRetry: () => void;
};

const CuisinesUnavailable = ({ onRetry }: CuisinesUnavailableProps) => (
  <>
    <p role="alert">The cuisines couldn't be loaded.</p>
    <button type="button" onClick={onRetry}>
      Load cuisines again
    </button>
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
    <p role="alert">The recipes couldn't be loaded.</p>
    <button type="button" onClick={onRetry}>
      Try again
    </button>
  </>
);

type RecipeItemProps = { recipe: Recipe };

const RecipeItem = ({ recipe }: RecipeItemProps) => (
  <li>
    <h2>
      <Link to={`/recipes/${recipe.slug}`}>{recipe.title}</Link>
    </h2>
    <RecipeCuisines cuisines={recipe.cuisines} />
    {recipe.description !== '' && <p>{recipe.description}</p>}
  </li>
);

type NoRecipesProps = { searchTerm: string; cuisineName: string | undefined };

const NoRecipes = ({ searchTerm, cuisineName }: NoRecipesProps) => {
  const subject = cuisineName === undefined ? 'recipes' : `${cuisineName} recipes`;
  if (searchTerm === '') {
    return <p>{`No ${subject} yet.`}</p>;
  }
  return <p>{`No ${subject} match “${searchTerm}”.`}</p>;
};

type RecipeCountProps = { count: number };

const RecipeCount = ({ count }: RecipeCountProps) => <p>{`${count} ${count === 1 ? 'recipe' : 'recipes'}`}</p>;

type RecipesProps = { recipes: Recipe[]; searchTerm: string; cuisineName: string | undefined };

const Recipes = ({ recipes, searchTerm, cuisineName }: RecipesProps) => {
  if (recipes.length === 0) {
    return <NoRecipes searchTerm={searchTerm} cuisineName={cuisineName} />;
  }
  return (
    <>
      <RecipeCount count={recipes.length} />
      <ul>
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
    <main>
      <title>Recipes · Tastebook</title>
      <h1>Recipes</h1>
      {/* No form: results follow the typing and the dropdown, so Enter has nothing to submit. */}
      <search>
        <RecipeSearch value={searchText} onChange={handleSearchChange} />
        <CuisinePicker value={cuisine} onChange={handleCuisineChange} />
      </search>
      <RecipeList filters={{ searchTerm, cuisine }} />
      <Link to="/">Back to Tastebook</Link>
    </main>
  );
};
