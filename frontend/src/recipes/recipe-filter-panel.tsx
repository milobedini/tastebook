import type { ReactNode } from 'react';

import { Banner, Button, FilterChip } from '../ui';
import { useCourses } from './courses-api';
import { useCuisines } from './cuisines-api';
import { difficulties, difficultyLabels } from './difficulty';
import type { RecipeFilters, TimeFilterName } from './recipe-filters';
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

const CourseGroup = ({ filters, onChange }: FilterChangeProps) => {
  const { data: courses, isPending, refetch } = useCourses();
  const content = () => {
    if (courses !== undefined) {
      return (
        <ChoiceChips
          choices={courses.map(({ slug, name }) => ({ value: slug, label: name }))}
          selected={filters.courses}
          onChange={(selected) => onChange({ ...filters, courses: selected })}
        />
      );
    }
    // Refetching a query that has never succeeded resets it to pending, so "Load courses again" shows this too.
    if (isPending) {
      return <p>Loading courses…</p>;
    }
    return (
      <GroupUnavailable
        title="The courses couldn't be loaded."
        retryLabel="Load courses again"
        onRetry={() => void refetch()}
      />
    );
  };
  return <FilterGroup legend="Course">{content()}</FilterGroup>;
};

const CuisineGroup = ({ filters, onChange }: FilterChangeProps) => {
  const { data: cuisines, isPending, refetch } = useCuisines();
  const content = () => {
    if (cuisines !== undefined) {
      return (
        <ChoiceChips
          choices={cuisines.map(({ slug, name }) => ({ value: slug, label: name }))}
          selected={filters.cuisines}
          onChange={(selected) => onChange({ ...filters, cuisines: selected })}
        />
      );
    }
    // Refetching a query that has never succeeded resets it to pending, so "Load cuisines again" shows this too.
    if (isPending) {
      return <p>Loading cuisines…</p>;
    }
    return (
      <GroupUnavailable
        title="The cuisines couldn't be loaded."
        retryLabel="Load cuisines again"
        onRetry={() => void refetch()}
      />
    );
  };
  return <FilterGroup legend="Cuisine">{content()}</FilterGroup>;
};

const OnePotGroup = ({ filters, onChange }: FilterChangeProps) => (
  <FilterGroup legend="One-pot">
    <FilterChip pressed={filters.onePot} onPressedChange={(pressed) => onChange({ ...filters, onePot: pressed })}>
      One-pot only
    </FilterChip>
  </FilterGroup>
);

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
  </div>
);
