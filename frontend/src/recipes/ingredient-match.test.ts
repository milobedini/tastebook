import { describe, expect, it } from 'vitest';

import { matchesIngredient } from './ingredient-match';

describe('matchesIngredient', () => {
  it.each<[string, string[], string, boolean]>([
    ['aubergine', [], 'aub', true],
    ['aubergine', ['eggplant'], 'EGGPLANT', true],
    ['aubergine', ['eggplant'], ' plant ', true],
    ['crème fraîche', [], 'creme fraiche', true],
    ['creme fraiche', [], 'crème', true],
    ['flat-leaf parsley', ['Italian parsley'], 'italian', true],
    ['aubergine', [], '', true],
    ['aubergine', ['eggplant'], 'courgette', false]
  ])('%s, also %j, matching "%s" is %s', (name, synonyms, text, expected) => {
    expect(matchesIngredient({ slug: name.replaceAll(' ', '-'), name, synonyms }, text)).toBe(expected);
  });
});
