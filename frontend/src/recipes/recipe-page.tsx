import { useState } from 'react';
import { Link, useParams } from 'react-router';

import type { components } from '../api/schema';
import {
  Button,
  ErrorWithRetry,
  Loading,
  Page,
  Polaroid,
  RecipePhoto,
  SegmentedControl,
  StickeredPhoto
} from '../dino';
import type { UnitSystem } from './convert';
import { describeDietTagConflict, dietTagLabels, stickerTags } from './diet-tags';
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
    <StickeredPhoto
      stickers={stickerTags(recipe.diet_tags).map((tag) => ({ label: dietTagLabels[tag], kind: 'diet' }))}
    >
      <Polaroid frame="large" lean="left">
        <RecipePhoto
          shape="hero"
          photo={recipe.photo}
          recipeId={recipe.id}
          alt={recipe.title}
          caption={recipe.photo && <RecipePhotoCredit photo={recipe.photo} />}
        />
      </Polaroid>
    </StickeredPhoto>
    <h1>{recipe.title}</h1>
    <p className="text-muted">
      {[difficultyLabels[recipe.difficulty], ...(recipe.one_pot ? ['One-pot'] : [])].join(' · ')}
    </p>
    {recipe.description !== '' && <p>{recipe.description}</p>}
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
    <Loading>Opening the recipe…</Loading>
  </>
);

type RecipeUnavailableProps = {
  onRetry: () => Promise<unknown>;
};

const RecipeUnavailable = ({ onRetry }: RecipeUnavailableProps) => (
  <>
    <title>Recipe · Tastebook</title>
    <ErrorWithRetry title="Couldn't load the recipe" onRetry={onRetry}>
      Check your connection, then try again.
    </ErrorWithRetry>
  </>
);

type RecipeForSlugProps = { slug: string };

const RecipeForSlug = ({ slug }: RecipeForSlugProps) => {
  const { data, errorUpdatedAt, refetch } = useRecipe(slug);
  if (data === null) {
    return <RecipeNotFound />;
  }
  // A recipe already shown stays up if a background refetch fails.
  if (data !== undefined) {
    return <RecipeDetails recipe={data} />;
  }
  // A refetch resets a never-successful query to pending but leaves errorUpdatedAt, so the error stays up through its retry.
  if (errorUpdatedAt > 0) {
    return <RecipeUnavailable onRetry={refetch} />;
  }
  return <RecipeLoading />;
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
    {/* A 672 px column until TAS-83's part 3 lays the recipe out to the full page width. */}
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <RecipeContent />
      <Button asChild variant="ghost" className="self-start">
        <Link to="/recipes">All recipes</Link>
      </Button>
    </div>
  </Page>
);
