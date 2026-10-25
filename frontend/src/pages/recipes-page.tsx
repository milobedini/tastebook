import { Link } from 'react-router';

import { useRecipes } from '../api/recipes';
import type { components } from '../api/schema';

type Recipe = components['schemas']['Recipe'];

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

type RecipesProps = { recipes: Recipe[] };

const Recipes = ({ recipes }: RecipesProps) => {
  if (recipes.length === 0) {
    return <p>No recipes yet.</p>;
  }
  return (
    <ul>
      {recipes.map((recipe) => (
        <RecipeItem key={recipe.id} recipe={recipe} />
      ))}
    </ul>
  );
};

const RecipeList = () => {
  const { data, isPending, refetch } = useRecipes();
  // A list already shown stays up if a background refetch fails.
  if (data !== undefined) {
    return <Recipes recipes={data} />;
  }
  // Refetching a query that has never succeeded resets it to pending, so "Try again" shows this too.
  if (isPending) {
    return <p>Loading recipes…</p>;
  }
  return <RecipesUnavailable onRetry={() => void refetch()} />;
};

export const RecipesPage = () => (
  <main>
    <title>Recipes · Tastebook</title>
    <h1>Recipes</h1>
    <RecipeList />
    <Link to="/">Back to Tastebook</Link>
  </main>
);
