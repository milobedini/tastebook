import { Minus, Plus } from 'lucide-react';

import { IconButton } from '@/ui/icon-button';

type ServingsStepperProps = {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
};

export const ServingsStepper = ({ value, min, max, onValueChange }: ServingsStepperProps) => (
  <div className="inline-flex items-center rounded-pill border border-field bg-surface">
    <IconButton
      icon={Minus}
      label="Fewer servings"
      disabled={value <= min}
      onClick={() => onValueChange(value - 1)}
      className="border-0 bg-chip"
    />
    <output aria-live="polite" className="min-w-24 text-center font-bold tabular-nums">
      {`Serves ${value}`}
    </output>
    <IconButton
      icon={Plus}
      label="More servings"
      disabled={value >= max}
      onClick={() => onValueChange(value + 1)}
      className="border-0 bg-chip"
    />
  </div>
);
