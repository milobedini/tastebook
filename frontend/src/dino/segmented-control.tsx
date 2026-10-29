import { Toggle } from 'radix-ui';

type SegmentedControlOption<Value extends string> = {
  value: Value;
  label: string;
};

type SegmentedControlProps<Value extends string> = {
  label: string;
  options: SegmentedControlOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
};

export const SegmentedControl = <Value extends string>({
  label,
  options,
  value,
  onValueChange
}: SegmentedControlProps<Value>) => (
  <fieldset className="inline-flex gap-1 rounded-pill border border-field bg-surface p-1">
    <legend className="sr-only">{label}</legend>
    {options.map((option) => (
      <Toggle.Root
        key={option.value}
        pressed={option.value === value}
        onPressedChange={() => onValueChange(option.value)}
        className="min-h-11 cursor-pointer rounded-pill px-4 text-label text-muted transition-colors data-[state=on]:bg-mint data-[state=on]:text-on-pastel"
      >
        {option.label}
      </Toggle.Root>
    ))}
  </fieldset>
);
