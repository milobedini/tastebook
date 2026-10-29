import type { components } from '../api/schema';

type DietTag = components['schemas']['DietTag'];
type DietTagConflict = components['schemas']['DietTagConflict'];

export const dietTags: DietTag[] = ['vegetarian', 'vegan', 'gluten_free', 'dairy_free'];

export const dietTagLabels: Record<DietTag, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten-free',
  dairy_free: 'Dairy-free'
};

// "vegetarian, vegan and dairy-free", with no comma before the "and".
const joinWithAnd = (words: string[]) =>
  words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

export const describeDietTagConflict = ({ ingredient, diet_tags }: DietTagConflict) =>
  `Leave out the ${ingredient.name} to keep it ${joinWithAnd(diet_tags.map((tag) => dietTagLabels[tag].toLowerCase()))}.`;

// Vegan implies vegetarian and dairy-free, so a vegan recipe's sticker says it alone.
const impliedByVegan: DietTag[] = ['vegetarian', 'dairy_free'];

export const stickerTags = (tags: DietTag[]): DietTag[] =>
  tags.includes('vegan') ? tags.filter((tag) => !impliedByVegan.includes(tag)) : tags;
