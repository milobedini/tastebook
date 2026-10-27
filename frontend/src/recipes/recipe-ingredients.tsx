import { useId, useState } from 'react';

import type { components } from '../api/schema';
import { ServingsStepper } from '../ui';
import { formatQuantity } from './format-quantity';
import { scale } from './scale';

type Recipe = components['schemas']['Recipe'];
type IngredientLine = components['schemas']['IngredientLine'];

type LinesProps = { lines: IngredientLine[]; factor: number };

const IngredientLineItem = ({ line, factor }: { line: IngredientLine; factor: number }) => {
  const quantity = formatQuantity(scale(line, factor));
  return (
    <li className="min-w-0 break-words">
      {quantity !== '' && `${quantity} `}
      {line.ingredient.name}
      {line.note !== '' && `, ${line.note}`}
      {line.optional && <span className="text-muted"> (optional)</span>}
    </li>
  );
};

const IngredientLines = ({ lines, factor }: LinesProps) => (
  <ul className="flex flex-col gap-2 tabular-nums">
    {lines.map((line) => (
      <IngredientLineItem key={line.id} line={line} factor={factor} />
    ))}
  </ul>
);

// A group saved before its lines were added has nothing to show yet.
const groupsWithLines = (recipe: Recipe) => recipe.ingredient_groups.filter(({ lines }) => lines.length > 0);

export const hasIngredients = (recipe: Recipe) =>
  recipe.ingredient_lines.length > 0 || groupsWithLines(recipe).length > 0;

// The model allows up to 32767; past this a stepper clicked one at a time stops being a way to get there.
const maxServings = 99;

type RecipeIngredientsProps = { recipe: Recipe };

export const RecipeIngredients = ({ recipe }: RecipeIngredientsProps) => {
  const headingId = useId();
  // The database holds exactly one of servings and a yield.
  const original = recipe.servings ?? recipe.yield_amount ?? 1;
  const [scaledTo, setScaledTo] = useState(original);
  if (!hasIngredients(recipe)) {
    return null;
  }
  const factor = scaledTo / original;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId}>Ingredients</h2>
      {(recipe.servings !== null || recipe.yield_amount !== null) && (
        <div>
          <ServingsStepper
            value={scaledTo}
            min={1}
            max={Math.max(maxServings, original)}
            onValueChange={setScaledTo}
            yieldUnit={recipe.servings === null ? recipe.yield_unit : undefined}
          />
        </div>
      )}
      {recipe.ingredient_lines.length > 0 && <IngredientLines lines={recipe.ingredient_lines} factor={factor} />}
      {groupsWithLines(recipe).map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <h3 className="break-words">{group.name}</h3>
          <IngredientLines lines={group.lines} factor={factor} />
        </div>
      ))}
    </section>
  );
};
