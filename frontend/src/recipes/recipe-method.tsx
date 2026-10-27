import { useId } from 'react';

import type { components } from '../api/schema';

type Recipe = components['schemas']['Recipe'];

type RecipeMethodProps = { recipe: Recipe };

export const RecipeMethod = ({ recipe }: RecipeMethodProps) => {
  const headingId = useId();
  if (recipe.steps.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId}>Method</h2>
      <ol className="flex list-decimal flex-col gap-4 pl-6 marker:font-bold marker:text-muted">
        {recipe.steps.map((step) => (
          <li key={step.id} className="min-w-0 break-words pl-1">
            {step.text}
          </li>
        ))}
      </ol>
    </section>
  );
};
