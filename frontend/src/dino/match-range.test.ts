import { describe, expect, it } from 'vitest';

import { matchRange } from './match-range';

describe('matchRange', () => {
  it.each<[string, string, { start: number; end: number } | null]>([
    ['Chickpeas', 'chick', { start: 0, end: 5 }],
    ['Chicken thighs', 'KEN', { start: 4, end: 7 }],
    ['crème fraîche', 'creme', { start: 0, end: 5 }],
    ['creme fraiche', 'crème', { start: 0, end: 5 }],
    ['crème fraîche', 'fraiche', { start: 6, end: 13 }],
    ['aubergine', ' aub ', { start: 0, end: 3 }],
    ['aubergine', '', { start: 0, end: 0 }],
    ['aubergine', 'kale', null]
  ])('finds "%s" matching "%s" at %j', (text, search, expected) => {
    expect(matchRange(text, search)).toEqual(expected);
  });
});
