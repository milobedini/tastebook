import { Link, useParams } from 'react-router';

import { useRecipe } from '../api/recipes';
import type { components } from '../api/schema';

type Recipe = components['schemas']['Recipe'];

type RecipeDetailsProps = { recipe: Recipe };

const RecipeDetails = ({ recipe }: RecipeDetailsProps) => (
  <>
    {/* React 19 needs <title> to have a single string child. */}
    <title>{`${recipe.title} · Tastebook`}</title>
    <h1>{recipe.title}</h1>
    {recipe.description !== '' && <p>{recipe.description}</p>}
  </>
);

const RecipeNotFound = () => (
  <>
    <title>Recipe not found · Tastebook</title>
    <h1>Recipe not found</h1>
    <p>This recipe doesn't exist or has been removed.</p>
  </>
);

const RecipeLoading = () => (
  <>
    <title>Recipe · Tastebook</title>
    <p>Loading recipe…</p>
  </>
);

type RecipeUnavailableProps = {
  onRetry: () => void;
};

const RecipeUnavailable = ({ onRetry }: RecipeUnavailableProps) => (
  <>
    <title>Recipe · Tastebook</title>
    <p role="alert">The recipe couldn't be loaded.</p>
    <button type="button" onClick={onRetry}>
      Try again
    </button>
  </>
);

type RecipeForSlugProps = { slug: string };

const RecipeForSlug = ({ slug }: RecipeForSlugProps) => {
  const { data, isPending, refetch } = useRecipe(slug);
  if (data === null) {
    return <RecipeNotFound />;
  }
  // A recipe already shown stays up if a background refetch fails.
  if (data !== undefined) {
    return <RecipeDetails recipe={data} />;
  }
  // Refetching a query that has never succeeded resets it to pending, so "Try again" shows this too.
  if (isPending) {
    return <RecipeLoading />;
  }
  return <RecipeUnavailable onRetry={() => void refetch()} />;
};

const RecipeContent = () => {
  const { slug } = useParams();
  // The route always supplies a slug; this only narrows the type.
  if (slug === undefined) {
    return <RecipeNotFound />;
  }
  return <RecipeForSlug slug={slug} />;
};

export const RecipePage = () => (
  <main>
    <RecipeContent />
    <Link to="/recipes">All recipes</Link>
    <Link to="/">Back to Tastebook</Link>
  </main>
);
