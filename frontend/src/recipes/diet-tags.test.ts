import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { stickerTags } from './diet-tags';

type DietTag = components['schemas']['DietTag'];

describe('stickerTags', () => {
  it.each<[DietTag[], DietTag[]]>([
    [['vegetarian', 'vegan', 'dairy_free'], ['vegan']],
    [
      ['vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
      ['vegan', 'gluten_free']
    ],
    [
      ['vegetarian', 'gluten_free', 'dairy_free'],
      ['vegetarian', 'gluten_free', 'dairy_free']
    ],
    [['dairy_free'], ['dairy_free']],
    [[], []]
  ])('shows %j as the stickers %j', (tags, stickers) => {
    expect(stickerTags(tags)).toEqual(stickers);
  });
});
