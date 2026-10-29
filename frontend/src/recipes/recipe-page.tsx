import { useState } from 'react';
import { Link, useParams } from 'react-router';

import type { components } from '../api/schema';
import { Banner, Button, Page, Polaroid, RecipePhoto, SegmentedControl, Tag } from '../dino';
import type { UnitSystem } from './convert';
import { describeDietTagConflict, dietTagLabels } from './diet-tags';
import { difficultyLabels } from './difficulty';
import { RecipeFacts } from './recipe-facts';
import { hasIngredients, RecipeIngredients } from './recipe-ingredients';
import { RecipeMethod } from './recipe-method';
import { RecipePhotoCredit } from './recipe-photo-credit';
import { useRecipe } from './recipes-api';

type Recipe = components['schemas']['Recipe'];

type RecipeDetailsProps = { recipe: Recipe };

const unitSystems: { value: UnitSystem; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'us', label: 'US' }
];

// The unit system isn't remembered, so every recipe opens in metric.
const RecipeIngredientsAndMethod = ({ recipe }: RecipeDetailsProps) => {
  const [system, setSystem] = useState<UnitSystem>('metric');
  const [showOriginal, setShowOriginal] = useState(false);
  // Choosing a unit system asks for the amounts in it, not the original.
  const chooseSystem = (chosen: UnitSystem) => {
    setSystem(chosen);
    setShowOriginal(false);
  };
  return (
    <>
      {(hasIngredients(recipe) || recipe.steps.length > 0) && (
        <div>
          <SegmentedControl label="Units" options={unitSystems} value={system} onValueChange={chooseSystem} />
        </div>
      )}
      <RecipeIngredients
        recipe={recipe}
        system={system}
        showOriginal={showOriginal}
        onShowOriginalChange={setShowOriginal}
      />
      <RecipeMethod recipe={recipe} system={system} showOriginal={showOriginal} />
    </>
  );
};

const RecipeDetails = ({ recipe }: RecipeDetailsProps) => (
  <>
    {/* React 19 needs <title> to have a single string child. */}
    <title>{`${recipe.title} · Tastebook`}</title>
    <Polaroid frame="large" lean="left">
      <RecipePhoto
        shape="hero"
        photo={recipe.photo}
        recipeId={recipe.id}
        alt={recipe.title}
        caption={recipe.photo && <RecipePhotoCredit photo={recipe.photo} />}
      />
    </Polaroid>
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
      {recipe.diet_tags.map((tag) => (
        <li key={tag}>
          <Tag>{dietTagLabels[tag]}</Tag>
        </li>
      ))}
    </ul>
    {recipe.diet_tag_conflicts.map((conflict) => (
      <p key={conflict.ingredient.slug}>{describeDietTagConflict(conflict)}</p>
    ))}
    <RecipeFacts recipe={recipe} withServings={!hasIngredients(recipe)} />
    {/* Keyed so another recipe starts at its own servings, in metric. */}
    <RecipeIngredientsAndMethod key={recipe.id} recipe={recipe} />
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
