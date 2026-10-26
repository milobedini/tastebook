import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/ui/cn';

// Enamel has no corner for a 24 px box (the field corner would make it a circle), so it takes two spacing steps.
export const Checkbox = ({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    className={cn(
      'grid size-6 shrink-0 cursor-pointer place-items-center rounded-[--spacing(2)] border-2 border-field bg-surface text-on-cobalt transition-colors disabled:cursor-not-allowed data-[state=checked]:border-cobalt data-[state=checked]:bg-cobalt',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center">
      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
