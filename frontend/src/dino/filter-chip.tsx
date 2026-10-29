import { Check } from 'lucide-react';
import { Toggle } from 'radix-ui';

import { cn } from '@/dino/cn';

const tilts = { left: '-rotate-[1.5deg]', right: 'rotate-[1.5deg]' };

type FilterChipProps = {
  children: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  // Browse's quick filters only (docs/design.md, The fun, rationed); the caller alternates left and right.
  tilt?: keyof typeof tilts;
};

export const FilterChip = ({ children, pressed, onPressedChange, tilt }: FilterChipProps) => (
  <Toggle.Root
    pressed={pressed}
    onPressedChange={onPressedChange}
    className={cn(
      'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border-2 text-label transition active:scale-96',
      'border-field bg-transparent px-4 text-ink data-[state=off]:active:border-ink data-[state=off]:active:bg-line data-[state=off]:hover:border-ink data-[state=off]:hover:bg-surface',
      'data-[state=on]:border-transparent data-[state=on]:bg-mint data-[state=on]:pl-3 data-[state=on]:text-on-pastel data-[state=on]:active:bg-mint-pressed data-[state=on]:hover:bg-mint-hover',
      tilt && tilts[tilt]
    )}
  >
    {pressed && <Check aria-hidden="true" className="size-4" strokeWidth={3} />}
    {children}
  </Toggle.Root>
);
