import { useId, useState } from 'react';

import type { components } from '../api/schema';
import { FilterChip, ServingsStepper } from '../ui';
import { convert, type UnitSystem } from './convert';
import { formatQuantity } from './format-quantity';

type Recipe = components['schemas']['Recipe'];
type IngredientLine = components['schemas']['IngredientLine'];

type Reading = { factor: number; system: UnitSystem; showOriginal: boolean };

// The line as the page shows it, scaled and in the unit system, without the optional marker.
const describeLine = (line: IngredientLine, { factor, system }: Reading) => {
  const quantity = formatQuantity(convert(line, factor, system));
  return `${quantity === '' ? '' : `${quantity} `}${line.ingredient.name}${line.note === '' ? '' : `, ${line.note}`}`;
};

// A line written by hand has no original wording, so it reads as Tastebook shows it.
const differsFromOriginal = (line: IngredientLine, reading: Reading) =>
  line.original_text !== '' && line.original_text !== describeLine(line, reading);

const IngredientLineItem = ({ line, reading }: { line: IngredientLine; reading: Reading }) => {
  if (reading.showOriginal && line.original_text !== '') {
    return <li className="min-w-0 break-words">{line.original_text}</li>;
  }
  return (
    <li className="min-w-0 break-words">
      {describeLine(line, reading)}
      {line.optional && <span className="text-muted"> (optional)</span>}
    </li>
  );
};

type LinesProps = { lines: IngredientLine[]; reading: Reading };

const IngredientLines = ({ lines, reading }: LinesProps) => (
  <ul className="flex flex-col gap-2 tabular-nums">
    {lines.map((line) => (
      <IngredientLineItem key={line.id} line={line} reading={reading} />
    ))}
  </ul>
);

// A group saved before its lines were added has nothing to show yet.
const groupsWithLines = (recipe: Recipe) => recipe.ingredient_groups.filter(({ lines }) => lines.length > 0);

export const hasIngredients = (recipe: Recipe) =>
  recipe.ingredient_lines.length > 0 || groupsWithLines(recipe).length > 0;

// The model allows up to 32767; past this a stepper clicked one at a time stops being a way to get there.
const maxServings = 99;

type RecipeIngredientsProps = {
  recipe: Recipe;
  system: UnitSystem;
  showOriginal: boolean;
  onShowOriginalChange: (showOriginal: boolean) => void;
};

export const RecipeIngredients = ({ recipe, system, showOriginal, onShowOriginalChange }: RecipeIngredientsProps) => {
  const headingId = useId();
  // The database holds exactly one of servings and a yield.
  const original = recipe.servings ?? recipe.yield_amount ?? 1;
  const [scaledTo, setScaledTo] = useState(original);
  if (!hasIngredients(recipe)) {
    return null;
  }
  const reading = { factor: scaledTo / original, system, showOriginal };
  const lines = [...recipe.ingredient_lines, ...groupsWithLines(recipe).flatMap((group) => group.lines)];
  // Stays while pressed, so it can always be turned off again.
  const canShowOriginal = showOriginal || lines.some((line) => differsFromOriginal(line, reading));
  const canScale = recipe.servings !== null || recipe.yield_amount !== null;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId}>Ingredients</h2>
      {(canScale || canShowOriginal) && (
        <div className="flex flex-wrap items-center gap-2">
          {canScale && (
            <ServingsStepper
              value={scaledTo}
              min={1}
              max={Math.max(maxServings, original)}
              onValueChange={setScaledTo}
              yieldUnit={recipe.servings === null ? recipe.yield_unit : undefined}
            />
          )}
          {canShowOriginal && (
            <FilterChip pressed={showOriginal} onPressedChange={onShowOriginalChange}>
              Show original
            </FilterChip>
          )}
        </div>
      )}
      {recipe.ingredient_lines.length > 0 && <IngredientLines lines={recipe.ingredient_lines} reading={reading} />}
      {groupsWithLines(recipe).map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <h3 className="break-words">{group.name}</h3>
          <IngredientLines lines={group.lines} reading={reading} />
        </div>
      ))}
    </section>
  );
};
