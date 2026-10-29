import { CornerDownLeft } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { Field } from '@/dino/field';
import { Input } from '@/dino/input';
import { matchRange } from '@/dino/match-range';
import { RemovableChip } from '@/dino/removable-chip';

export type ComboboxOption = { value: string; name: string; hint?: string };

type ComboboxProps = {
  label: string;
  placeholder?: string;
  // What matches the search, without the chosen ones; the caller filters.
  options: ComboboxOption[];
  chosen: Pick<ComboboxOption, 'value' | 'name'>[];
  search: string;
  onSearchChange: (search: string) => void;
  onChoose: (value: string) => void;
  onRemove: (value: string) => void;
  // Each chip's accessible name is `${removeLabel}: ${name}`, like the board's "Remove ingredient: Onion".
  removeLabel: string;
  emptyText: string;
  // Opens the list on first render; the open-list story needs it, since play's focus is blurred before the shot.
  defaultOpen?: boolean;
};

type Range = { start: number; end: number };

const optionId = (comboboxId: string, index: number) => `${comboboxId}-option-${index}`;

const Highlighted = ({ text, range }: { text: string; range: Range | null }) => {
  if (range === null || range.start === range.end) {
    return text;
  }
  return (
    <>
      {text.slice(0, range.start)}
      <b className="font-extrabold">{text.slice(range.start, range.end)}</b>
      {text.slice(range.end)}
    </>
  );
};

const OptionText = ({ name, hint, search }: Omit<ComboboxOption, 'value'> & { search: string }) => {
  const nameRange = matchRange(name, search);
  const boldsName = nameRange !== null && nameRange.end > nameRange.start;
  return (
    // One inline child, and the space outside the muted span, so neither the flex layout nor the option's
    // accessible name drops the space.
    <span>
      <Highlighted text={name} range={nameRange} />
      {hint !== undefined && (
        <>
          {' '}
          <span className="text-muted">
            · <Highlighted text={hint} range={boldsName ? null : matchRange(hint, search)} />
          </span>
        </>
      )}
    </span>
  );
};

export const Combobox = ({
  label,
  placeholder,
  options,
  chosen,
  search,
  onSearchChange,
  onChoose,
  onRemove,
  removeLabel,
  emptyText,
  defaultOpen = false
}: ComboboxProps) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const expanded = open && options.length > 0;
  // With no active value, or one that left the list, the first option is active.
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === activeValue)
  );
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    if (expanded) {
      document.getElementById(optionId(id, activeIndex))?.scrollIntoView({ block: 'nearest' });
    }
  }, [id, expanded, activeIndex]);

  const choose = (value: string) => {
    onChoose(value);
    onSearchChange('');
    setOpen(false);
    setActiveValue(null);
  };

  const remove = (value: string) => {
    onRemove(value);
    // The chip is gone, so focus would otherwise fall to the page.
    inputRef.current?.focus();
  };

  const type = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
    setOpen(true);
    setActiveValue(null);
  };

  const move = (step: 1 | -1) => {
    if (!expanded) {
      setOpen(true);
      setActiveValue((step === 1 ? options[0] : options.at(-1))?.value ?? null);
      return;
    }
    const next = (activeIndex + step + options.length) % options.length;
    setActiveValue(options[next]?.value ?? null);
  };

  const closeOrClear = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && search === '') {
      // Left alone, so an enclosing sheet can close on it.
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      onSearchChange('');
    }
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && expanded) {
      event.preventDefault();
      const active = options[activeIndex];
      if (active) {
        choose(active.value);
      }
    } else if (event.key === 'Escape') {
      closeOrClear(event);
    }
  };

  return (
    <Field label={label}>
      {(control, { labelId }) => (
        <>
          {chosen.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-2">
              {chosen.map(({ value, name }) => (
                <RemovableChip key={value} removeLabel={removeLabel} onRemove={() => remove(value)}>
                  {name}
                </RemovableChip>
              ))}
            </div>
          )}
          <div>
            <Input
              {...control}
              ref={inputRef}
              role="combobox"
              aria-labelledby={labelId}
              aria-expanded={expanded}
              aria-controls={expanded ? listboxId : undefined}
              aria-activedescendant={expanded ? optionId(id, activeIndex) : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              placeholder={placeholder}
              value={search}
              onChange={type}
              onKeyDown={keyDown}
              onClick={() => setOpen(true)}
              onBlur={() => setOpen(false)}
            />
            {expanded && (
              <ul
                id={listboxId}
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the ARIA listbox pattern, as on the fields board
                role="listbox"
                aria-labelledby={labelId}
                className="mt-2 flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-card border-2 border-field bg-surface p-1.5"
              >
                {options.map(({ value, name, hint }, index) => (
                  <li
                    key={value}
                    id={optionId(id, index)}
                    // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the ARIA listbox pattern, as on the fields board
                    role="option"
                    aria-selected={index === activeIndex}
                    tabIndex={-1}
                    onMouseMove={() => setActiveValue(value)}
                    onMouseDown={(event) => {
                      // Focus stays in the input, so its blur doesn't close the list before the pick.
                      event.preventDefault();
                      choose(value);
                    }}
                    className="flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-option px-3.5 text-body text-ink aria-selected:bg-line aria-selected:outline-3 aria-selected:-outline-offset-3 aria-selected:outline-ink"
                  >
                    <OptionText name={name} hint={hint} search={search} />
                    {index === activeIndex && (
                      <CornerDownLeft aria-hidden="true" strokeWidth={2.5} className="size-4 shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div role="status">
              {open && options.length === 0 && (
                <p className="mt-2 rounded-card border-2 border-field bg-surface px-3.5 py-3 text-muted">{emptyText}</p>
              )}
            </div>
          </div>
        </>
      )}
    </Field>
  );
};
