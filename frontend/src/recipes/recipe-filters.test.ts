import { describe, expect, it } from 'vitest';

import type { RecipeFilters } from './recipe-filters';
import { noFilters, readFilters, writeFilters } from './recipe-filters';

describe('readFilters', () => {
  it.each<[string, RecipeFilters]>([
    ['', noFilters],
    ['cuisine=italian&cuisine=thai&cuisine=italian', { ...noFilters, cuisines: ['italian', 'thai'] }],
    ['course=main&course=&course=dessert', { ...noFilters, courses: ['main', 'dessert'] }],
    ['difficulty=hard&difficulty=eazy&difficulty=easy', { ...noFilters, difficulties: ['hard', 'easy'] }],
    ['max_total=30&max_prep=20&max_cook=60', { ...noFilters, times: { total: 30, prep: null, cook: 60 } }],
    ['max_total=45&max_total=15', { ...noFilters, times: { total: 45, prep: null, cook: null } }],
    ['max_prep=abc&max_cook=', noFilters],
    ['one_pot=true', { ...noFilters, onePot: true }],
    ['one_pot=yes', noFilters]
  ])('reads "%s"', (query, filters) => {
    expect(readFilters(new URLSearchParams(query))).toEqual(filters);
  });
});

describe('writeFilters', () => {
  it.each<[string, string, RecipeFilters]>([
    [
      'q=tart',
      'q=tart&cuisine=italian&cuisine=thai&max_total=30',
      { ...noFilters, cuisines: ['italian', 'thai'], times: { total: 30, prep: null, cook: null } }
    ],
    ['q=tart&cuisine=french&one_pot=true', 'q=tart', noFilters],
    [
      '',
      'cuisine=british&course=main&course=side&difficulty=hard&max_total=60&max_prep=45&max_cook=30&one_pot=true',
      {
        cuisines: ['british'],
        courses: ['main', 'side'],
        difficulties: ['hard'],
        times: { total: 60, prep: 45, cook: 30 },
        onePot: true
      }
    ]
  ])('from "%s", writes "%s"', (query, written, filters) => {
    expect(writeFilters(new URLSearchParams(query), filters).toString()).toBe(written);
  });
});
