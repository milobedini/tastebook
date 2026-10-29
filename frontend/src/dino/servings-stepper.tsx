import { type LucideIcon, Minus, Plus } from 'lucide-react';

import { cn } from '@/dino/cn';

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

const stepLooks = {
  fewer: 'border-field bg-transparent text-ink not-aria-disabled:hover:border-ink not-aria-disabled:hover:bg-surface',
  more: 'border-transparent bg-mint text-on-pastel not-aria-disabled:hover:bg-mint-hover not-aria-disabled:active:bg-mint-pressed'
};

type StepButtonProps = {
  icon: LucideIcon;
  label: string;
  look: keyof typeof stepLooks;
  atLimit: boolean;
  onStep: () => void;
};

// aria-disabled, not disabled, so a button at its limit keeps focus; the count says why it does nothing.
const StepButton = ({ icon: Icon, label, look, atLimit, onStep }: StepButtonProps) => (
  <button
    type="button"
    aria-label={label}
    aria-disabled={atLimit || undefined}
    onClick={atLimit ? undefined : onStep}
    className={cn(
      'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-pill border-2 transition not-aria-disabled:active:scale-92',
      stepLooks[look],
      'aria-disabled:cursor-not-allowed aria-disabled:border-field aria-disabled:border-dashed aria-disabled:bg-transparent aria-disabled:text-muted forced-colors:aria-disabled:border-[GrayText] forced-colors:aria-disabled:text-[GrayText]'
    )}
  >
    <Icon aria-hidden="true" className="size-4" strokeWidth={3} />
  </button>
);

export const ServingsStepper = ({ value, min, max, onValueChange, yieldUnit }: ServingsStepperProps) => {
  const labels = yieldUnit === undefined ? servingsLabels : yieldLabels(yieldUnit);
  return (
    <div className="inline-flex items-center gap-2">
      <StepButton
        icon={Minus}
        label={labels.fewer}
        look="fewer"
        atLimit={value <= min}
        onStep={() => onValueChange(value - 1)}
      />
      <output aria-live="polite" className="min-w-15.5 break-words text-center text-label tabular-nums">
        {labels.text(value)}
      </output>
      <StepButton
        icon={Plus}
        label={labels.more}
        look="more"
        atLimit={value >= max}
        onStep={() => onValueChange(value + 1)}
      />
    </div>
  );
};
