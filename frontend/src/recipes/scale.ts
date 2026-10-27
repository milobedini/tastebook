import type { components } from '../api/schema';

type Unit = components['schemas']['UnitEnum'];
type IngredientLine = components['schemas']['IngredientLine'];

type Quantity = Pick<IngredientLine, 'amount' | 'amount_max' | 'unit'>;
type Amounts = Pick<IngredientLine, 'amount' | 'amount_max'>;
type Round = (amount: number, amountMax: number | null) => Amounts;

// Multiplying by a fraction like 7/6 leaves float noise (2.0000000004) that would push a whole number into a range.
const tidy = (value: number) => Math.round(value * 1e6) / 1e6;

// Steps per whole unit, so a step like 0.05 stays exact: 4 is the nearest quarter.
const toStep = (perUnit: number) => (value: number) => Math.max(1 / perUnit, Math.round(value * perUnit) / perUnit);

const toNearestFiveAbove50 = (value: number) =>
  value > 50 ? Math.round(value / 5) * 5 : Math.max(1, Math.round(value));

// Each end rounds on its own; a range whose ends meet becomes one amount.
const measured =
  (roundOne: (value: number) => number): Round =>
  (amount, amountMax) => {
    const low = roundOne(amount);
    const high = amountMax === null ? low : roundOne(amountMax);
    return { amount: low, amount_max: high === low ? null : high };
  };

// Within a quarter of a whole number counts as it: 17 cookies' worth of a pinch is still one pinch.
const nearWhole = (value: number) => (Math.abs(value - Math.round(value)) <= 0.25 ? Math.round(value) : null);

// Nobody can use 1.5 eggs: an amount between whole numbers widens to the whole numbers either side, never below 1.
const counted: Round = (amount, amountMax) => {
  const top = amountMax ?? amount;
  const low = Math.max(1, nearWhole(amount) ?? Math.floor(amount));
  const high = Math.max(low, nearWhole(top) ?? Math.ceil(top));
  return { amount: low, amount_max: high === low ? null : high };
};

const spoonsAndCups = measured(toStep(4));
const metricLarge = measured(toStep(20));

const rounding: Record<Unit | '', Round> = {
  g: measured(toNearestFiveAbove50),
  ml: measured(toNearestFiveAbove50),
  kg: metricLarge,
  l: metricLarge,
  tsp: spoonsAndCups,
  tbsp: spoonsAndCups,
  cup: spoonsAndCups,
  oz: spoonsAndCups,
  lb: spoonsAndCups,
  fl_oz: spoonsAndCups,
  pinch: counted,
  clove: counted,
  tin: counted,
  slice: counted,
  bunch: counted,
  handful: counted,
  '': counted
};

// Multiplies a line's amount by factor and rounds it to what can be measured; at factor 1 the recipe's own amount stays.
export const scale = <T extends Quantity>(quantity: T, factor: number): T => {
  const { amount, amount_max, unit } = quantity;
  if (amount === null || factor === 1) {
    return quantity;
  }
  return {
    ...quantity,
    ...rounding[unit](tidy(amount * factor), amount_max === null ? null : tidy(amount_max * factor))
  };
};
