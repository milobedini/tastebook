import type { ReactNode } from 'react';

import type { components } from '../api/schema';
import { formatMinutes } from './format-minutes';

type Recipe = components['schemas']['Recipe'];

type FactProps = { term: string; children: ReactNode };

const Fact = ({ term, children }: FactProps) => (
  <>
    <dt className="text-muted">{term}</dt>
    <dd className="min-w-0 break-words">{children}</dd>
  </>
);

type NamesFactProps = { one: string; many: string; names: { name: string }[] };

// Equipment is optional and older recipes may have no cuisine or course, so an empty row is left out rather than shown blank.
const NamesFact = ({ one, many, names }: NamesFactProps) => {
  if (names.length === 0) {
    return null;
  }
  return <Fact term={names.length === 1 ? one : many}>{names.map(({ name }) => name).join(', ')}</Fact>;
};

const capitalise = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

type RecipeFactsProps = { recipe: Recipe };

export const RecipeFacts = ({ recipe }: RecipeFactsProps) => (
  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 tabular-nums">
    <NamesFact one="Cuisine" many="Cuisines" names={recipe.cuisines} />
    <NamesFact one="Course" many="Courses" names={recipe.courses} />
    <Fact term="Prep">{formatMinutes(recipe.prep_minutes)}</Fact>
    <Fact term="Cook">{formatMinutes(recipe.cook_minutes)}</Fact>
    {recipe.extra_minutes > 0 && (
      <Fact term={capitalise(recipe.extra_label)}>{formatMinutes(recipe.extra_minutes)}</Fact>
    )}
    <Fact term="Total">{formatMinutes(recipe.total_minutes)}</Fact>
    {recipe.servings !== null && <Fact term="Serves">{recipe.servings}</Fact>}
    {recipe.yield_amount !== null && <Fact term="Makes">{`${recipe.yield_amount} ${recipe.yield_unit}`}</Fact>}
    <NamesFact one="Equipment" many="Equipment" names={recipe.equipment} />
    {recipe.source !== '' && <Fact term="Source">{recipe.source}</Fact>}
  </dl>
);
