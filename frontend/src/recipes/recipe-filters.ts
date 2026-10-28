import type { components } from '../api/schema';
import { difficulties } from './difficulty';

type Difficulty = components['schemas']['DifficultyEnum'];

export const timeLimits = [15, 30, 45, 60] as const;
export type TimeLimit = (typeof timeLimits)[number];

// One list drives the panel's groups, the chips and the address, so a time filter is added in one place.
export const timeFilters = [
  { name: 'total', param: 'max_total', legend: 'Total time', chip: 'Total' },
  { name: 'prep', param: 'max_prep', legend: 'Prep time', chip: 'Prep' },
  { name: 'cook', param: 'max_cook', legend: 'Cook time', chip: 'Cook' }
] as const;
export type TimeFilterName = (typeof timeFilters)[number]['name'];

export type RecipeFilters = {
  cuisines: string[];
  courses: string[];
  difficulties: Difficulty[];
  times: Record<TimeFilterName, TimeLimit | null>;
  onePot: boolean;
};

export const noFilters: RecipeFilters = {
  cuisines: [],
  courses: [],
  difficulties: [],
  times: { total: null, prep: null, cook: null },
  onePot: false
};

const filterParams = ['cuisine', 'course', 'difficulty', ...timeFilters.map(({ param }) => param), 'one_pot'];

const unique = <T>(values: T[]) => [...new Set(values)];

const isDifficulty = (value: string): value is Difficulty => difficulties.some((difficulty) => difficulty === value);

const isTimeLimit = (value: number): value is TimeLimit => timeLimits.some((limit) => limit === value);

const readTimeLimit = (value: string | null) => {
  const minutes = Number(value);
  return value !== null && isTimeLimit(minutes) ? minutes : null;
};

// Anything the page doesn't know is ignored, so a mistyped link still shows recipes.
export const readFilters = (params: URLSearchParams): RecipeFilters => ({
  cuisines: unique(params.getAll('cuisine').filter((slug) => slug !== '')),
  courses: unique(params.getAll('course').filter((slug) => slug !== '')),
  difficulties: unique(params.getAll('difficulty').filter(isDifficulty)),
  times: {
    total: readTimeLimit(params.get('max_total')),
    prep: readTimeLimit(params.get('max_prep')),
    cook: readTimeLimit(params.get('max_cook'))
  },
  onePot: params.get('one_pot') === 'true'
});

// Replaces only the filter parameters, so the search and anything else stay where they were.
export const writeFilters = (params: URLSearchParams, filters: RecipeFilters): URLSearchParams => {
  const kept = [...params].filter(([name]) => !filterParams.includes(name));
  const entries = [
    ...filters.cuisines.map((slug) => ['cuisine', slug]),
    ...filters.courses.map((slug) => ['course', slug]),
    ...filters.difficulties.map((difficulty) => ['difficulty', difficulty]),
    ...timeFilters.flatMap(({ name, param }) => {
      const limit = filters.times[name];
      return limit === null ? [] : [[param, String(limit)]];
    }),
    ...(filters.onePot ? [['one_pot', 'true']] : [])
  ];
  return new URLSearchParams([...kept, ...entries]);
};

export const hasFilters = (filters: RecipeFilters) =>
  filters.cuisines.length > 0 ||
  filters.courses.length > 0 ||
  filters.difficulties.length > 0 ||
  Object.values(filters.times).some((limit) => limit !== null) ||
  filters.onePot;

export const toggled = <T>(values: T[], value: T) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
