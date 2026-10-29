import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/dino/cn';

export const Checkbox = ({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    className={cn(
      // Ticked, the border turns transparent rather than going, so forced colours still draws the box.
      'grid size-7 shrink-0 cursor-pointer place-items-center rounded-check border-[2.5px] border-field text-on-pastel transition-transform disabled:cursor-not-allowed data-[state=checked]:border-transparent data-[state=checked]:bg-mint',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center">
      <Check aria-hidden="true" className="size-4" strokeWidth={3.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
