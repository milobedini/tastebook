import { Command } from 'cmdk';
import { Plus } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useState } from 'react';

import type { components } from '../api/schema';
import { Button } from '../ui';
import { matchesIngredient } from './ingredient-match';

type IngredientOption = components['schemas']['IngredientOption'];

type IngredientPickerProps = {
  label: string;
  // Already without the ingredients picked in either list.
  ingredients: IngredientOption[];
  onPick: (slug: string) => void;
};

export const IngredientPicker = ({ label, ingredients, onPick }: IngredientPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
    }
  };

  const pick = (slug: string) => {
    onPick(slug);
    changeOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Trigger asChild>
        <Button variant="secondary">
          <Plus aria-hidden="true" />
          {label}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label={label}
          align="start"
          sideOffset={4}
          className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-field border border-field bg-surface p-0 shadow-lg"
        >
          {/* cmdk names its input from the Command's label, with aria-labelledby. */}
          <Command shouldFilter={false} label="Search ingredients">
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type an ingredient"
              className="h-11 w-full border-line border-b bg-surface px-3 text-body text-ink placeholder:text-muted"
            />
            <Command.List className="max-h-64 overflow-y-auto p-1">
              {ingredients
                .filter((ingredient) => matchesIngredient(ingredient, search))
                .map(({ slug, name, synonyms }) => (
                  <Command.Item
                    key={slug}
                    value={slug}
                    onSelect={() => pick(slug)}
                    className="flex min-h-11 cursor-pointer items-center rounded-field px-3 text-body text-ink data-[selected=true]:bg-chip data-[selected=true]:outline-2 data-[selected=true]:outline-cobalt data-[selected=true]:-outline-offset-2"
                  >
                    {/* One inline child, and the space outside the muted span, so neither the flex layout nor the
                        option's accessible name drops the space. */}
                    <span>
                      {name}
                      {synonyms.length > 0 && (
                        <>
                          {' '}
                          <span className="text-muted">· also {synonyms.join(', ')}</span>
                        </>
                      )}
                    </span>
                  </Command.Item>
                ))}
              <Command.Empty className="px-3 py-2 text-muted">No ingredients match.</Command.Empty>
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
