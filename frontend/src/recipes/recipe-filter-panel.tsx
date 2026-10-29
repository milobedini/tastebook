import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { Banner, Button, FilterChip, SegmentedControl } from '../dino';
import { useCourses } from './courses-api';
import { useCuisines } from './cuisines-api';
import { dietTagLabels, dietTags } from './diet-tags';
import { difficulties, difficultyLabels } from './difficulty';
import { IngredientPicker } from './ingredient-picker';
import { useIngredients } from './ingredients-api';
import type { IncludeMatch, RecipeFilters, TimeFilterName } from './recipe-filters';
import { timeFilters, timeLimits, toggled } from './recipe-filters';

type FilterGroupProps = { legend: string; children: ReactNode };

const FilterGroup = ({ legend, children }: FilterGroupProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-label">{legend}</legend>
    <div className="flex flex-wrap gap-2">{children}</div>
  </fieldset>
);

type Choice<T> = { value: T; label: string };

type ChoiceChipsProps<T> = { choices: Choice<T>[]; selected: T[]; onChange: (selected: T[]) => void };

const ChoiceChips = <T extends string>({ choices, selected, onChange }: ChoiceChipsProps<T>) =>
  choices.map(({ value, label }) => (
    <FilterChip
      key={value}
      pressed={selected.includes(value)}
      onPressedChange={() => onChange(toggled(selected, value))}
    >
      {label}
    </FilterChip>
  ));

type GroupUnavailableProps = { title: string; retryLabel: string; onRetry: () => void };

const GroupUnavailable = ({ title, retryLabel, onRetry }: GroupUnavailableProps) => (
  <div className="flex w-full flex-col gap-2">
    <Banner tone="danger" title={title} />
    <Button variant="secondary" className="self-start" onClick={onRetry}>
      {retryLabel}
    </Button>
  </div>
);

type FilterChangeProps = { filters: RecipeFilters; onChange: (filters: RecipeFilters) => void };

type TimeGroupProps = FilterChangeProps & { name: TimeFilterName; legend: string };

// One limit at a time: "up to 30" already contains "up to 15".
const TimeGroup = ({ name, legend, filters, onChange }: TimeGroupProps) => (
  <FilterGroup legend={legend}>
    {timeLimits.map((limit) => (
      <FilterChip
        key={limit}
        pressed={filters.times[name] === limit}
        onPressedChange={(pressed) =>
          onChange({ ...filters, times: { ...filters.times, [name]: pressed ? limit : null } })
        }
      >
        {`Up to ${limit} min`}
      </FilterChip>
    ))}
  </FilterGroup>
);

const difficultyChoices = difficulties.map((difficulty) => ({
  value: difficulty,
  label: difficultyLabels[difficulty]
}));

const DifficultyGroup = ({ filters, onChange }: FilterChangeProps) => (
  <FilterGroup legend="Difficulty">
    <ChoiceChips
      choices={difficultyChoices}
      selected={filters.difficulties}
      onChange={(selected) => onChange({ ...filters, difficulties: selected })}
    />
  </FilterGroup>
);

type QueryGroupProps<T> = {
  legend: string;
  query: UseQueryResult<T>;
  loading: string;
  errorTitle: string;
  retryLabel: string;
  children: (data: T) => ReactNode;
};

const QueryGroup = <T,>({ legend, query, loading, errorTitle, retryLabel, children }: QueryGroupProps<T>) => {
  const { data, isPending, refetch } = query;
  const content = () => {
    if (data !== undefined) {
      return children(data);
    }
    // Refetching a query that has never succeeded resets it to pending, so the retry shows the loading text too.
    if (isPending) {
      return <p>{loading}</p>;
    }
    return <GroupUnavailable title={errorTitle} retryLabel={retryLabel} onRetry={() => void refetch()} />;
  };
  return <FilterGroup legend={legend}>{content()}</FilterGroup>;
};

const CourseGroup = ({ filters, onChange }: FilterChangeProps) => (
  <QueryGroup
    legend="Course"
    query={useCourses()}
    loading="Loading courses…"
    errorTitle="The courses couldn't be loaded."
    retryLabel="Load courses again"
  >
    {(courses) => (
      <ChoiceChips
        choices={courses.map(({ slug, name }) => ({ value: slug, label: name }))}
        selected={filters.courses}
        onChange={(selected) => onChange({ ...filters, courses: selected })}
      />
    )}
  </QueryGroup>
);

const CuisineGroup = ({ filters, onChange }: FilterChangeProps) => (
  <QueryGroup
    legend="Cuisine"
    query={useCuisines()}
    loading="Loading cuisines…"
    errorTitle="The cuisines couldn't be loaded."
    retryLabel="Load cuisines again"
  >
    {(cuisines) => (
      <ChoiceChips
        choices={cuisines.map(({ slug, name }) => ({ value: slug, label: name }))}
        selected={filters.cuisines}
        onChange={(selected) => onChange({ ...filters, cuisines: selected })}
      />
    )}
  </QueryGroup>
);

const OnePotGroup = ({ filters, onChange }: FilterChangeProps) => (
  <FilterGroup legend="One-pot">
    <FilterChip pressed={filters.onePot} onPressedChange={(pressed) => onChange({ ...filters, onePot: pressed })}>
      One-pot only
    </FilterChip>
  </FilterGroup>
);

const dietChoices = dietTags.map((tag) => ({ value: tag, label: dietTagLabels[tag] }));

// Every diet picked must hold, so the chips toggle independently.
const DietGroup = ({ filters, onChange }: FilterChangeProps) => (
  <FilterGroup legend="Diet">
    <ChoiceChips
      choices={dietChoices}
      selected={filters.diets}
      onChange={(selected) => onChange({ ...filters, diets: selected })}
    />
  </FilterGroup>
);

const includeMatchOptions: { value: IncludeMatch; label: string }[] = [
  { value: 'any', label: 'With any' },
  { value: 'all', label: 'With all' }
];

const IngredientFilterGroup = ({ filters, onChange }: FilterChangeProps) => {
  // An ingredient picked in one list isn't offered in either, so it can't be both included and excluded.
  const picked = [...filters.includedIngredients, ...filters.excludedIngredients];
  return (
    <QueryGroup
      legend="Ingredients"
      query={useIngredients()}
      loading="Loading ingredients…"
      errorTitle="The ingredients couldn't be loaded."
      retryLabel="Load ingredients again"
    >
      {(ingredients) => {
        const unpicked = ingredients.filter(({ slug }) => !picked.includes(slug));
        // A slug the API doesn't know gets no chip, as in Filters on.
        const known = (slugs: string[]) =>
          slugs.flatMap((slug) => ingredients.filter((ingredient) => ingredient.slug === slug));
        return (
          <>
            <IngredientPicker
              label="Include an ingredient"
              offered={unpicked}
              chosen={known(filters.includedIngredients)}
              onPick={(slug) => onChange({ ...filters, includedIngredients: [...filters.includedIngredients, slug] })}
              onRemove={(slug) =>
                onChange({
                  ...filters,
                  includedIngredients: filters.includedIngredients.filter((item) => item !== slug)
                })
              }
            />
            {/* With one included ingredient, any and all are the same, so the choice waits for a second. */}
            {filters.includedIngredients.length > 1 && (
              <SegmentedControl
                label="Included ingredients"
                options={includeMatchOptions}
                value={filters.includeMatch}
                onValueChange={(includeMatch) => onChange({ ...filters, includeMatch })}
              />
            )}
            <IngredientPicker
              label="Exclude an ingredient"
              offered={unpicked}
              chosen={known(filters.excludedIngredients)}
              onPick={(slug) => onChange({ ...filters, excludedIngredients: [...filters.excludedIngredients, slug] })}
              onRemove={(slug) =>
                onChange({
                  ...filters,
                  excludedIngredients: filters.excludedIngredients.filter((item) => item !== slug)
                })
              }
            />
          </>
        );
      }}
    </QueryGroup>
  );
};

type RecipeFilterPanelProps = FilterChangeProps & { id: string };

export const RecipeFilterPanel = ({ id, filters, onChange }: RecipeFilterPanelProps) => (
  <div id={id} className="flex flex-col gap-4">
    {timeFilters.map(({ name, legend }) => (
      <TimeGroup key={name} name={name} legend={legend} filters={filters} onChange={onChange} />
    ))}
    <DifficultyGroup filters={filters} onChange={onChange} />
    <CourseGroup filters={filters} onChange={onChange} />
    <CuisineGroup filters={filters} onChange={onChange} />
    <OnePotGroup filters={filters} onChange={onChange} />
    <DietGroup filters={filters} onChange={onChange} />
    <IngredientFilterGroup filters={filters} onChange={onChange} />
  </div>
);
