import type { components } from '../api/schema';
import { matchRange } from '../dino';

type IngredientOption = components['schemas']['IngredientOption'];

// The API's search rule: the name or any synonym contains the text, ignoring case and accents.
export const matchesIngredient = (ingredient: IngredientOption, text: string) =>
  [ingredient.name, ...ingredient.synonyms].some((name) => matchRange(name, text) !== null);
