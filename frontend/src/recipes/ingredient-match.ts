import type { components } from '../api/schema';

type IngredientOption = components['schemas']['IngredientOption'];

const folded = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en-GB');

// The API's search rule: the name or any synonym contains the text, ignoring case and accents.
export const matchesIngredient = (ingredient: IngredientOption, text: string) => {
  const term = folded(text.trim());
  return [ingredient.name, ...ingredient.synonyms].some((name) => folded(name).includes(term));
};
