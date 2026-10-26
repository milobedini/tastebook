import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { useRecipes } from '../api/recipes';
import type { components } from '../api/schema';
import { useDebouncedValue } from '../hooks/use-debounced-value';

type Recipe = components['schemas']['Recipe'];

const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 3;

// Shorter terms would match most of the list, so they search nothing and show it all.
const toSearchTerm = (text: string) => {
  const term = text.trim();
  return term.length >= MIN_SEARCH_LENGTH ? term : '';
};

type RecipeSearchProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

// No form: results follow the typing, so Enter has nothing to submit.
const RecipeSearch = ({ value, onChange }: RecipeSearchProps) => (
  <search>
    <label>
      Search recipes <input type="search" value={value} onChange={onChange} />
    </label>
  </search>
);

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
    {recipe.description !== '' && <p>{recipe.description}</p>}
  </li>
);

type NoRecipesProps = { searchTerm: string };

const NoRecipes = ({ searchTerm }: NoRecipesProps) => {
  if (searchTerm === '') {
    return <p>No recipes yet.</p>;
  }
  return <p>{`No recipes match “${searchTerm}”.`}</p>;
};

type RecipeCountProps = { count: number };

const RecipeCount = ({ count }: RecipeCountProps) => <p>{`${count} ${count === 1 ? 'recipe' : 'recipes'}`}</p>;

type RecipesProps = { recipes: Recipe[]; searchTerm: string };

const Recipes = ({ recipes, searchTerm }: RecipesProps) => {
  if (recipes.length === 0) {
    return <NoRecipes searchTerm={searchTerm} />;
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

type RecipeListProps = { searchTerm: string };

const RecipeList = ({ searchTerm }: RecipeListProps) => {
  const { data, isPending, refetch } = useRecipes(searchTerm);
  // A list already shown stays up if a background refetch fails.
  if (data !== undefined) {
    return <Recipes recipes={data.recipes} searchTerm={data.searchTerm} />;
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
      setSearchParams(text === '' ? {} : { q: text }, { replace: true });
    },
    [setSearchParams]
  );

  return (
    <main>
      <title>Recipes · Tastebook</title>
      <h1>Recipes</h1>
      <RecipeSearch value={searchText} onChange={handleSearchChange} />
      <RecipeList searchTerm={searchTerm} />
      <Link to="/">Back to Tastebook</Link>
    </main>
  );
};
