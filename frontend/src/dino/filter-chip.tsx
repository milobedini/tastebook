import { Toggle } from 'radix-ui';

type FilterChipProps = {
  children: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
};

export const FilterChip = ({ children, pressed, onPressedChange }: FilterChipProps) => (
  <Toggle.Root
    pressed={pressed}
    onPressedChange={onPressedChange}
    className="inline-flex min-h-11 cursor-pointer items-center rounded-pill border border-field bg-surface px-3.5 font-bold text-ink text-small transition-colors data-[state=on]:border-cobalt data-[state=on]:bg-cobalt data-[state=on]:text-on-cobalt"
  >
    {children}
  </Toggle.Root>
);
