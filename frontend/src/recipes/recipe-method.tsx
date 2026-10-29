import { useId } from 'react';

import type { components } from '../api/schema';
import { Method } from '../dino';
import { convertTemperatures } from './convert';
import type { Reading } from './recipe-ingredients';

type Recipe = components['schemas']['Recipe'];

type RecipeMethodProps = { recipe: Recipe; reading: Reading };

export const RecipeMethod = ({ recipe, reading: { system, showOriginal } }: RecipeMethodProps) => {
  const headingId = useId();
  if (recipe.steps.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 lg:col-start-2 lg:row-start-2">
      <h2 id={headingId}>Method</h2>
      <Method
        steps={recipe.steps.map((step) => ({
          key: step.id,
          text: showOriginal ? step.text : convertTemperatures(step.text, system)
        }))}
      />
    </section>
  );
};
