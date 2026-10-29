import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import type { components } from '../api/schema';
import {
  ErrorWithRetry,
  FilterChip,
  Loading,
  Page,
  Polaroid,
  RecipePhoto,
  SegmentedControl,
  ServingsStepper,
  StickeredPhoto
} from '../dino';
import type { UnitSystem } from './convert';
import { dietTagLabels, stickerTags } from './diet-tags';
import { canShowOriginal, hasIngredients, type Reading, RecipeIngredients } from './recipe-ingredients';
import { RecipeIntro } from './recipe-intro';
import { RecipeMethod } from './recipe-method';
import { RecipePhotoCredit } from './recipe-photo-credit';
import { useRecipe } from './recipes-api';

type Recipe = components['schemas']['Recipe'];

type RecipeProps = { recipe: Recipe };

const unitSystems: { value: UnitSystem; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'us', label: 'US' }
];

// The model allows up to 32767; past this a stepper clicked one at a time stops being a way to get there.
const maxServings = 99;

type RecipeControlsProps = {
  recipe: Recipe;
  reading: Reading;
  scaledTo: number;
  onScaledToChange: (scaledTo: number) => void;
  onSystemChange: (system: UnitSystem) => void;
  onShowOriginalChange: (showOriginal: boolean) => void;
};

const RecipeControls = ({
  recipe,
  reading,
  scaledTo,
  onScaledToChange,
  onSystemChange,
  onShowOriginalChange
}: RecipeControlsProps) => {
  const canScale = hasIngredients(recipe) && (recipe.servings !== null || recipe.yield_amount !== null);
  const canConvert = hasIngredients(recipe) || recipe.steps.length > 0;
  const showOriginalShown = canShowOriginal(recipe, reading);
  if (!canScale && !canConvert && !showOriginalShown) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canScale && (
        <ServingsStepper
          value={scaledTo}
          min={1}
          max={Math.max(maxServings, recipe.servings ?? recipe.yield_amount ?? 1)}
          onValueChange={onScaledToChange}
          yieldUnit={recipe.servings === null ? recipe.yield_unit : undefined}
        />
      )}
      {canConvert && (
        <SegmentedControl label="Units" options={unitSystems} value={reading.system} onValueChange={onSystemChange} />
      )}
      {showOriginalShown && (
        <FilterChip pressed={reading.showOriginal} onPressedChange={onShowOriginalChange}>
          Show original
        </FilterChip>
      )}
    </div>
  );
};

// The servings, unit system and Show original aren't remembered, so every recipe opens as written, in metric.
// The DOM keeps the phone's order at every width, so reading and focus order match; a laptop's grid places the
// photo and ingredients on the left (5 parts) and the rest on the right (7).
const RecipeBody = ({ recipe }: RecipeProps) => {
  // The database holds exactly one of servings and a yield.
  const original = recipe.servings ?? recipe.yield_amount ?? 1;
  const [scaledTo, setScaledTo] = useState(original);
  const [system, setSystem] = useState<UnitSystem>('metric');
  const [showOriginal, setShowOriginal] = useState(false);
  // Choosing a unit system asks for the amounts in it, not the original.
  const chooseSystem = (chosen: UnitSystem) => {
    setSystem(chosen);
    setShowOriginal(false);
  };
  const reading = { factor: scaledTo / original, system, showOriginal };
  return (
    <div className="grid grid-cols-1 gap-8 max-lg:max-w-2xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10">
      <div className="lg:col-start-1 lg:row-start-1 lg:px-6 lg:pt-2">
        <StickeredPhoto
          stickers={stickerTags(recipe.diet_tags).map((tag) => ({ label: dietTagLabels[tag], kind: 'diet' }))}
        >
          <Polaroid frame="large" lean="left" tape>
            <RecipePhoto
              shape="hero"
              photo={recipe.photo}
              recipeId={recipe.id}
              alt={recipe.title}
              caption={recipe.photo && <RecipePhotoCredit photo={recipe.photo} />}
            />
          </Polaroid>
        </StickeredPhoto>
      </div>
      <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-1">
        <RecipeIntro recipe={recipe} />
        <RecipeControls
          recipe={recipe}
          reading={reading}
          scaledTo={scaledTo}
          onScaledToChange={setScaledTo}
          onSystemChange={chooseSystem}
          onShowOriginalChange={setShowOriginal}
        />
      </div>
      <RecipeIngredients recipe={recipe} reading={reading} />
      <RecipeMethod recipe={recipe} reading={reading} />
    </div>
  );
};

const RecipeDetails = ({ recipe }: RecipeProps) => (
  <>
    {/* React 19 needs <title> to have a single string child. */}
    <title>{`${recipe.title} · Tastebook`}</title>
    {/* Keyed so another recipe starts at its own servings, in metric. */}
    <RecipeBody key={recipe.id} recipe={recipe} />
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
    <Link
      to="/recipes"
      className="inline-flex min-h-11 items-center gap-1 self-start text-label no-underline hover:underline"
    >
      <ChevronLeft aria-hidden="true" className="size-4.5" strokeWidth={2.5} />
      All recipes
    </Link>
    <RecipeContent />
  </Page>
);
