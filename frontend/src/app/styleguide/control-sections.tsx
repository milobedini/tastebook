import { Bookmark, CalendarPlus, Ellipsis, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  CheckboxRow,
  Field,
  FilterChip,
  IconButton,
  Input,
  NativeSelect,
  RemovableChip,
  SearchInput,
  SegmentedControl,
  ServingsStepper,
  Tag
} from '../../ui';
import { StyleguideSection } from './styleguide-section';

const toggled = (set: ReadonlySet<string>, name: string) =>
  new Set(set.has(name) ? [...set].filter((item) => item !== name) : [...set, name]);

export const ButtonsSection = () => {
  const [isFavourite, setIsFavourite] = useState(false);

  return (
    <StyleguideSection title="Buttons" description={'Cobalt fill means "this does something". One primary per screen.'}>
      <div className="flex flex-wrap items-center gap-2">
        <Button>
          <Bookmark aria-hidden="true" />
          Save recipe
        </Button>
        <Button variant="secondary">
          <CalendarPlus aria-hidden="true" />
          Add to plan
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete account</Button>
        <Button disabled>Save recipe</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton icon={Heart} label="Favourite" pressed={isFavourite} onClick={() => setIsFavourite(!isFavourite)} />
        <IconButton icon={Share2} label="Share" />
        <IconButton icon={Ellipsis} label="More actions" />
      </div>
    </StyleguideSection>
  );
};

export const FieldsSection = () => (
  <StyleguideSection
    title="Fields"
    description="A visible label, help under the field, errors that say how to fix them."
  >
    <Field label="Search">
      {(control) => <SearchInput {...control} placeholder="Recipes, ingredients, cuisines" autoComplete="off" />}
    </Field>
    <Field label="Recipe title" help="Shown on cards and at the top of the recipe.">
      {(control) => <Input {...control} defaultValue="Courgette and lemon orzo" />}
    </Field>
    <Field label="Servings" error="Enter a number, like 4.">
      {(control) => <Input {...control} defaultValue="four" />}
    </Field>
    <Field label="Cuisine">
      {(control) => (
        <NativeSelect {...control} defaultValue="">
          <option value="">All cuisines</option>
          <option value="italian">Italian</option>
          <option value="indian">Indian</option>
          <option value="japanese">Japanese</option>
        </NativeSelect>
      )}
    </Field>
  </StyleguideSection>
);

const filterChips = ['Vegetarian', 'One-pot', 'Under 30 min', 'Italian'];

export const FiltersSection = () => {
  const [pressedChips, setPressedChips] = useState<ReadonlySet<string>>(new Set(['Vegetarian', 'One-pot']));
  const [isRemovableShown, setIsRemovableShown] = useState(true);

  return (
    <StyleguideSection
      title="Filters and tags"
      description="Chips are filters you toggle; yolk tags describe a recipe and can't be tapped."
    >
      <div className="flex flex-wrap items-center gap-2">
        {filterChips.map((chip) => (
          <FilterChip
            key={chip}
            pressed={pressedChips.has(chip)}
            onPressedChange={() => setPressedChips(toggled(pressedChips, chip))}
          >
            {chip}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isRemovableShown ? (
          <RemovableChip onRemove={() => setIsRemovableShown(false)}>Italian</RemovableChip>
        ) : (
          <Button variant="ghost" onClick={() => setIsRemovableShown(true)}>
            Add it back
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag>Vegetarian</Tag>
        <Tag>One-pot</Tag>
        <Tag>Easy</Tag>
      </div>
    </StyleguideSection>
  );
};

type Units = 'metric' | 'us';

const unitOptions: { value: Units; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'us', label: 'US' }
];

export const ServingsSection = () => {
  const [servings, setServings] = useState(4);
  const [units, setUnits] = useState<Units>('metric');

  return (
    <StyleguideSection title="Servings and units" description="The recipe page's two controls.">
      <div className="flex flex-wrap items-center gap-2">
        <ServingsStepper value={servings} min={1} max={12} onValueChange={setServings} />
        <SegmentedControl label="Units" options={unitOptions} value={units} onValueChange={setUnits} />
      </div>
    </StyleguideSection>
  );
};

const aisles = [
  {
    name: 'Fruit and veg',
    items: [
      { id: 'onions', amount: '3', name: 'onions' },
      { id: 'courgettes', amount: '2', name: 'courgettes' },
      { id: 'lemon', amount: '1', name: 'lemon' }
    ]
  },
  {
    name: 'Dairy and eggs',
    items: [{ id: 'cheese', amount: '40 g', name: 'Italian-style hard cheese' }]
  }
];

export const ShoppingListSection = () => {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set(['onions']));

  return (
    <StyleguideSection
      title="Shopping list"
      description="Rows on hairlines, grouped by aisle. Ticking an item adds it to the pantry."
    >
      {aisles.map((aisle) => (
        <div key={aisle.name} className="flex flex-col">
          <h3 className="pb-1 font-body text-label text-muted">{aisle.name}</h3>
          <ul>
            {aisle.items.map((item) => (
              <li key={item.id}>
                <CheckboxRow checked={ticked.has(item.id)} onCheckedChange={() => setTicked(toggled(ticked, item.id))}>
                  <b className="tabular-nums">{item.amount}</b> {item.name}
                </CheckboxRow>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </StyleguideSection>
  );
};
