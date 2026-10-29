import { Minus, Plus } from 'lucide-react';

import { IconButton } from '@/dino/icon-button';

type ServingsStepperProps = {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  // A recipe with a yield ("makes 12 cookies") steps that instead of servings.
  yieldUnit?: string;
};

const servingsLabels = { text: (value: number) => `Serves ${value}`, fewer: 'Fewer servings', more: 'More servings' };

const yieldLabels = (unit: string) => ({
  text: (value: number) => `Makes ${value} ${unit}`,
  fewer: 'Make fewer',
  more: 'Make more'
});

export const ServingsStepper = ({ value, min, max, onValueChange, yieldUnit }: ServingsStepperProps) => {
  const labels = yieldUnit === undefined ? servingsLabels : yieldLabels(yieldUnit);
  return (
    <div className="inline-flex items-center rounded-pill border border-field bg-surface">
      <IconButton
        icon={Minus}
        label={labels.fewer}
        disabled={value <= min}
        onClick={() => onValueChange(value - 1)}
        className="border-0 bg-line"
      />
      <output aria-live="polite" className="min-w-24 break-words px-2 text-center font-bold tabular-nums">
        {labels.text(value)}
      </output>
      <IconButton
        icon={Plus}
        label={labels.more}
        disabled={value >= max}
        onClick={() => onValueChange(value + 1)}
        className="border-0 bg-line"
      />
    </div>
  );
};
