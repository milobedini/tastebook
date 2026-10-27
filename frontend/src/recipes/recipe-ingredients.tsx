import { useId } from 'react';

import type { components } from '../api/schema';
import { formatQuantity } from './format-quantity';

type Recipe = components['schemas']['Recipe'];
type IngredientLine = components['schemas']['IngredientLine'];

const IngredientLineItem = ({ line }: { line: IngredientLine }) => {
  const quantity = formatQuantity(line);
  return (
    <li className="min-w-0 break-words">
      {quantity !== '' && `${quantity} `}
      {line.ingredient.name}
      {line.note !== '' && `, ${line.note}`}
      {line.optional && <span className="text-muted"> (optional)</span>}
    </li>
  );
};

const IngredientLines = ({ lines }: { lines: IngredientLine[] }) => (
  <ul className="flex flex-col gap-2 tabular-nums">
    {lines.map((line) => (
      <IngredientLineItem key={line.id} line={line} />
    ))}
  </ul>
);

type RecipeIngredientsProps = { recipe: Recipe };

export const RecipeIngredients = ({ recipe }: RecipeIngredientsProps) => {
  const headingId = useId();
  // A group saved before its lines were added has nothing to show yet.
  const groups = recipe.ingredient_groups.filter(({ lines }) => lines.length > 0);
  if (recipe.ingredient_lines.length === 0 && groups.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId}>Ingredients</h2>
      {recipe.ingredient_lines.length > 0 && <IngredientLines lines={recipe.ingredient_lines} />}
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <h3 className="break-words">{group.name}</h3>
          <IngredientLines lines={group.lines} />
        </div>
      ))}
    </section>
  );
};
