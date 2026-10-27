import { describe, expect, it } from 'vitest';

import { formatQuantity } from './format-quantity';

describe('formatQuantity', () => {
  it.each([
    [200, null, 'g', '200 g'],
    [1500, null, 'ml', '1,500 ml'],
    [1.5, null, 'tbsp', '1.5 tbsp'],
    [0.25, null, 'tsp', '0.25 tsp'],
    [0.333, null, 'cup', '0.333 cup'],
    [1, null, 'cup', '1 cup'],
    [2, null, 'cup', '2 cups'],
    [1, null, 'fl_oz', '1 fl oz'],
    [8, null, 'fl_oz', '8 fl oz'],
    [1, null, 'tin', '1 tin'],
    [2, null, 'clove', '2 cloves'],
    [3, null, 'pinch', '3 pinches'],
    [2, null, 'bunch', '2 bunches'],
    [1, 2, 'handful', '1–2 handfuls'],
    [2, 3, 'tbsp', '2–3 tbsp'],
    [2, 3, '', '2–3'],
    [2, null, '', '2'],
    [null, null, 'pinch', 'pinch'],
    [null, null, '', '']
  ] as const)('shows %s up to %s %s as "%s"', (amount, amount_max, unit, text) => {
    expect(formatQuantity({ amount, amount_max, unit })).toBe(text);
  });
});
