import { Button, RemovableChip } from '../ui';
import { useCourses } from './courses-api';
import { useCuisines } from './cuisines-api';
import { difficultyLabels } from './difficulty';
import type { RecipeFilters } from './recipe-filters';
import { hasFilters, noFilters, timeFilters } from './recipe-filters';

type Named = { slug: string; name: string };

type ActiveFilter = { key: string; label: string; without: RecipeFilters };

// While the list loads or has failed, a chip shows its slug so it stays removable; once loaded, the API ignores a slug
// that isn't in it, so it gets no chip.
const namedChips = (
  kind: string,
  slugs: string[],
  list: Named[] | undefined,
  without: (slug: string) => RecipeFilters
): ActiveFilter[] =>
  slugs.flatMap((slug) => {
    const label = list === undefined ? slug : list.find((item) => item.slug === slug)?.name;
    return label === undefined ? [] : [{ key: `${kind}-${slug}`, label, without: without(slug) }];
  });

const toActiveFilters = (filters: RecipeFilters, courses: Named[] | undefined, cuisines: Named[] | undefined) => [
  ...timeFilters.flatMap(({ name, chip }): ActiveFilter[] => {
    const limit = filters.times[name];
    if (limit === null) {
      return [];
    }
    const without = { ...filters, times: { ...filters.times, [name]: null } };
    return [{ key: `time-${name}`, label: `${chip} up to ${limit} min`, without }];
  }),
  ...filters.difficulties.map(
    (difficulty): ActiveFilter => ({
      key: `difficulty-${difficulty}`,
      label: difficultyLabels[difficulty],
      without: { ...filters, difficulties: filters.difficulties.filter((item) => item !== difficulty) }
    })
  ),
  ...namedChips('course', filters.courses, courses, (slug) => ({
    ...filters,
    courses: filters.courses.filter((item) => item !== slug)
  })),
  ...namedChips('cuisine', filters.cuisines, cuisines, (slug) => ({
    ...filters,
    cuisines: filters.cuisines.filter((item) => item !== slug)
  })),
  ...(filters.onePot ? [{ key: 'one-pot', label: 'One-pot', without: { ...filters, onePot: false } }] : [])
];

type ActiveFiltersProps = { filters: RecipeFilters; onChange: (filters: RecipeFilters) => void };

export const ActiveFilters = ({ filters, onChange }: ActiveFiltersProps) => {
  const { data: courses } = useCourses();
  const { data: cuisines } = useCuisines();
  if (!hasFilters(filters)) {
    return null;
  }
  return (
    <ul aria-label="Filters on" className="flex flex-wrap items-center gap-2">
      {toActiveFilters(filters, courses, cuisines).map(({ key, label, without }) => (
        <li key={key}>
          <RemovableChip onRemove={() => onChange(without)}>{label}</RemovableChip>
        </li>
      ))}
      <li>
        <Button variant="ghost" onClick={() => onChange(noFilters)}>
          Clear filters
        </Button>
      </li>
    </ul>
  );
};
