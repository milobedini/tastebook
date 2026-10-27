import { Link, useParams } from 'react-router';

import type { components } from '../api/schema';
import { Banner, Button, CuisinePlate, Page, Tag } from '../ui';
import { difficultyLabels } from './difficulty';
import { RecipeFacts } from './recipe-facts';
import { useRecipe } from './recipes-api';

type Recipe = components['schemas']['Recipe'];

type RecipeDetailsProps = { recipe: Recipe };

const RecipeDetails = ({ recipe }: RecipeDetailsProps) => (
  <>
    {/* React 19 needs <title> to have a single string child. */}
    <title>{`${recipe.title} · Tastebook`}</title>
    <CuisinePlate shape="hero" cuisineSlug={recipe.cuisines[0]?.slug} />
    <h1>{recipe.title}</h1>
    {recipe.description !== '' && <p>{recipe.description}</p>}
    <ul className="flex flex-wrap gap-2">
      <li>
        <Tag>{difficultyLabels[recipe.difficulty]}</Tag>
      </li>
      {recipe.one_pot && (
        <li>
          <Tag>One-pot</Tag>
        </li>
      )}
    </ul>
    <RecipeFacts recipe={recipe} />
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
    <Banner tone="danger" title="The recipe couldn't be loaded." />
    <Button variant="secondary" className="self-start" onClick={onRetry}>
      Try again
    </Button>
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
  <Page>
    <RecipeContent />
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="ghost">
        <Link to="/recipes">All recipes</Link>
      </Button>
      <Button asChild variant="ghost">
        <Link to="/">Back to Tastebook</Link>
      </Button>
    </div>
  </Page>
);
