import { describe, expect, it } from 'vitest';

import { formatMinutes } from './format-minutes';

describe('formatMinutes', () => {
  it.each([
    [0, '0 min'],
    [5, '5 min'],
    [45, '45 min'],
    [59, '59 min'],
    [60, '1 hr'],
    [61, '1 hr 1 min'],
    [90, '1 hr 30 min'],
    [120, '2 hr'],
    [185, '3 hr 5 min'],
    [1440, '24 hr']
  ])('shows %i minutes as "%s"', (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text);
  });
});
