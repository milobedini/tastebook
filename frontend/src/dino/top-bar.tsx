import { Search } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { NavLink } from 'react-router';

import { cn } from '@/dino/cn';
import { Field } from '@/dino/field';
import { IconButton } from '@/dino/icon-button';
import { SearchInput } from '@/dino/input';
import { Wordmark } from '@/dino/wordmark';

type TopBarProps = {
  searchLabel: string;
  searchValue: string;
  onSearchValueChange: (text: string) => void;
};

// The inner row has the page's width and gutters, so the wordmark lines up with the content at any width.
export const TopBar = ({ searchLabel, searchValue, onSearchValueChange }: TopBarProps) => {
  const searchId = useId();
  const searchRef = useRef<HTMLElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // A search that's on stays visible, so the field never hides what the list is filtered by.
  const isSearchShown = isSearchOpen || searchValue !== '';

  const toggleSearch = () => {
    if (isSearchShown && searchValue === '') {
      setIsSearchOpen(false);
      return;
    }
    flushSync(() => setIsSearchOpen(true));
    // SearchInput keeps its own ref for its clear button, so focus goes through the wrapper.
    searchRef.current?.querySelector('input')?.focus();
  };

  return (
    <header className="border-line border-b pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid w-full max-w-300 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 pr-[max(--spacing(5),env(safe-area-inset-right))] pl-[max(--spacing(5),env(safe-area-inset-left))] sm:pr-[max(--spacing(8),env(safe-area-inset-right))] sm:pl-[max(--spacing(8),env(safe-area-inset-left))]">
        <div className="flex min-h-19 items-center">
          <NavLink to="/" end className="inline-flex min-h-11 items-center text-display-l no-underline">
            <Wordmark />
          </NavLink>
        </div>
        <IconButton
          icon={Search}
          label={searchLabel}
          aria-expanded={isSearchShown}
          aria-controls={searchId}
          className="lg:hidden"
          onClick={toggleSearch}
        />
        <search
          id={searchId}
          ref={searchRef}
          className={cn(
            'col-span-2 pb-4 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:block lg:w-90 lg:pb-0',
            !isSearchShown && 'hidden'
          )}
        >
          <Field label={searchLabel} hideLabel>
            {(control) => (
              <SearchInput
                {...control}
                value={searchValue}
                onValueChange={onSearchValueChange}
                placeholder={searchLabel}
              />
            )}
          </Field>
        </search>
      </div>
    </header>
  );
};
