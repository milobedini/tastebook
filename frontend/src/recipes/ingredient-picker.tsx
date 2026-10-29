import { useState } from 'react';

import type { components } from '../api/schema';
import { Combobox, type ComboboxOption } from '../dino';
import { matchesIngredient } from './ingredient-match';

type IngredientOption = components['schemas']['IngredientOption'];

type IngredientPickerProps = {
  label: string;
  // Without the ingredients picked in either list.
  offered: IngredientOption[];
  // Picked in this list, in the order picked.
  chosen: IngredientOption[];
  onPick: (slug: string) => void;
  onRemove: (slug: string) => void;
};

const toOption = ({ slug, name, synonyms }: IngredientOption): ComboboxOption => ({
  value: slug,
  name,
  hint: synonyms.length > 0 ? `also ${synonyms.join(', ')}` : undefined
});

export const IngredientPicker = ({ label, offered, chosen, onPick, onRemove }: IngredientPickerProps) => {
  const [search, setSearch] = useState('');
  const options = offered.filter((ingredient) => matchesIngredient(ingredient, search)).map(toOption);

  return (
    <div className="w-full">
      <Combobox
        label={label}
        placeholder="Type an ingredient"
        options={options}
        chosen={chosen.map(toOption)}
        search={search}
        onSearchChange={setSearch}
        onChoose={onPick}
        onRemove={onRemove}
        removeLabel="Remove ingredient"
        emptyText="No ingredients match."
      />
    </div>
  );
};
