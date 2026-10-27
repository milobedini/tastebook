import type { components } from '../api/schema';
import { roundIn, scale } from './scale';

type Unit = components['schemas']['UnitEnum'];
type IngredientLine = components['schemas']['IngredientLine'];

type Quantity = Pick<IngredientLine, 'amount' | 'amount_max' | 'unit'>;

export type UnitSystem = 'metric' | 'us';

type Dimension = 'mass' | 'volume';
type MeasuredUnit = Extract<Unit, 'g' | 'kg' | 'oz' | 'lb' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'fl_oz'>;

// Grams or millilitres in one of each unit. A cup is the US legal cup and fl oz the US one, as US recipes use them.
const measures: Record<MeasuredUnit, { dimension: Dimension; size: number }> = {
  g: { dimension: 'mass', size: 1 },
  kg: { dimension: 'mass', size: 1000 },
  oz: { dimension: 'mass', size: 28.349523125 },
  lb: { dimension: 'mass', size: 453.59237 },
  ml: { dimension: 'volume', size: 1 },
  l: { dimension: 'volume', size: 1000 },
  tsp: { dimension: 'volume', size: 5 },
  tbsp: { dimension: 'volume', size: 15 },
  cup: { dimension: 'volume', size: 240 },
  fl_oz: { dimension: 'volume', size: 29.5735295625 }
};

const isMeasured = (unit: Unit | ''): unit is MeasuredUnit => unit in measures;

type System = {
  // Units the system reads as written, so a recipe's own "2 tbsp" or "4 fl oz" stays that way.
  keeps: ReadonlySet<Unit | ''>;
  // The unit an amount from the other system reads in, by its size in grams or millilitres.
  units: Record<Dimension, (size: number) => MeasuredUnit>;
};

const systems: Record<UnitSystem, System> = {
  // Millilitres aren't kept, so a small volume reads in spoons whoever wrote it.
  metric: {
    keeps: new Set(['g', 'kg', 'l', 'tsp', 'tbsp']),
    units: {
      mass: (grams) => (grams < 1000 ? 'g' : 'kg'),
      volume: (millilitres) => {
        if (millilitres < 15) {
          return 'tsp';
        }
        if (millilitres <= 45) {
          return 'tbsp';
        }
        return millilitres < 1000 ? 'ml' : 'l';
      }
    }
  },
  us: {
    keeps: new Set(['tsp', 'tbsp', 'cup', 'oz', 'lb', 'fl_oz']),
    units: {
      mass: (grams) => (grams < measures.lb.size ? 'oz' : 'lb'),
      volume: (millilitres) => {
        if (millilitres < 15) {
          return 'tsp';
        }
        return millilitres < measures.cup.size / 4 ? 'tbsp' : 'cup';
      }
    }
  }
};

// Scales a line's amount by factor and reads it in system, within its dimension: a cup of flour becomes 240 ml, never
// grams. Count units and units the system keeps only scale, so they round as scale() rounds them.
export const convert = <T extends Quantity>(quantity: T, factor: number, system: UnitSystem): T => {
  const { amount, amount_max, unit } = quantity;
  const { keeps, units } = systems[system];
  if (amount === null || !isMeasured(unit) || keeps.has(unit)) {
    return scale(quantity, factor);
  }
  const { dimension, size } = measures[unit];
  const toBase = (value: number) => value * factor * size;
  const target = units[dimension](toBase(amount_max ?? amount));
  if (target === unit) {
    return scale(quantity, factor);
  }
  const inTarget = (value: number) => toBase(value) / measures[target].size;
  return {
    ...quantity,
    unit: target,
    ...roundIn(target, inTarget(amount), amount_max === null ? null : inTarget(amount_max))
  };
};

const temperatureScale: Record<UnitSystem, 'C' | 'F'> = { metric: 'C', us: 'F' };

const toNearestFive = (value: number) => Math.round(value / 5) * 5;

const fromScale = {
  C: (celsius: number) => toNearestFive((celsius * 9) / 5 + 32),
  F: (fahrenheit: number) => toNearestFive(((fahrenheit - 32) * 5) / 9)
};

// "180°C", "180 °C" or a range "180–200°C". The minus counts only where no digit comes before it, so "180-200°C" is
// a range, not 180 and -200.
const temperature = /(?<!\d)(-?\d+(?:\.\d+)?)(?:\s?[-–]\s?(\d+(?:\.\d+)?))?\s?°\s?([CF])/g;

// Rewrites the temperatures in a step's text in system, to the nearest 5 degrees; the rest of the text stays as written.
export const convertTemperatures = (text: string, system: UnitSystem) => {
  const wanted = temperatureScale[system];
  return text.replace(temperature, (written, low: string, high: string | undefined, from: 'C' | 'F') => {
    if (from === wanted) {
      return written;
    }
    const convertOne = (value: string) => `${fromScale[from](Number(value))}`;
    return high === undefined ? `${convertOne(low)}°${wanted}` : `${convertOne(low)}–${convertOne(high)}°${wanted}`;
  });
};
