import { describe, expect, it } from 'vitest';

import { formatQuantity } from './format-quantity';
import { scale } from './scale';

describe('scale', () => {
  it.each([
    // Spoons and cups go to the nearest quarter, never below one.
    [1.5, null, 'tbsp', 1.5, '2.25 tbsp'],
    [0.5, null, 'tsp', 1 / 6, '0.25 tsp'],
    [1, null, 'cup', 1.1, '1 cup'],
    [0.333, null, 'cup', 2, '0.75 cup'],
    [1, null, 'cup', 7 / 4, '1.75 cups'],
    // Grams and millilitres go to the nearest 5 above 50, and to whole numbers up to it, never below 1.
    [600, null, 'g', 7 / 6, '700 g'],
    [125, null, 'g', 17 / 16, '135 g'],
    [25, null, 'g', 1.5, '38 g'],
    [2, null, 'g', 0.1, '1 g'],
    [150, null, 'ml', 7 / 6, '175 ml'],
    [40, null, 'ml', 0.5, '20 ml'],
    // Kilograms and litres go to the nearest 0.05.
    [1.2, null, 'kg', 1.5, '1.8 kg'],
    [1, null, 'l', 1 / 3, '0.35 l'],
    // Imperial weights and volumes go to the nearest quarter.
    [8, null, 'oz', 1.5, '12 oz'],
    [1, null, 'lb', 1 / 3, '0.25 lb'],
    [4, null, 'fl_oz', 1.1, '4.5 fl oz'],
    // Whole items go to the nearest whole number within a quarter, or else the range either side, never below one.
    [6, null, '', 7 / 6, '7'],
    [1, null, '', 7 / 6, '1'],
    [1, null, '', 1.5, '1–2'],
    [2, null, '', 1.4, '3'],
    [2, null, '', 1.3, '2–3'],
    [2, null, '', 0.75, '1–2'],
    [1, null, '', 0.5, '1'],
    // Count units round like whole items.
    [3, null, 'clove', 1.5, '4–5 cloves'],
    [1, null, 'pinch', 0.5, '1 pinch'],
    [1, null, 'pinch', 17 / 16, '1 pinch'],
    [1, null, 'tin', 1.5, '1–2 tins'],
    [4, null, 'slice', 1.25, '5 slices'],
    [1, null, 'bunch', 2, '2 bunches'],
    [1, null, 'handful', 0.5, '1 handful'],
    // A range scales at both ends, and becomes one amount when they round the same.
    [2, 3, '', 1.5, '3–5'],
    [3, 4, 'tbsp', 0.5, '1.5–2 tbsp'],
    [0.5, 1, 'tsp', 1 / 6, '0.25 tsp'],
    [2, 3, '', 0.25, '1'],
    // The recipe's own amount stays as written, and a line with no amount has nothing to scale.
    [0.333, null, 'cup', 1, '0.333 cup'],
    [1.5, null, '', 1, '1.5'],
    [null, null, 'pinch', 2, 'pinch'],
    [null, null, '', 2, '']
  ] as const)('scales %s up to %s %s by %d to "%s"', (amount, amount_max, unit, factor, text) => {
    expect(formatQuantity(scale({ amount, amount_max, unit }, factor))).toBe(text);
  });
});
