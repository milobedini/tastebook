import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/dino/cn';

export const Checkbox = ({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    className={cn(
      'grid size-6 shrink-0 cursor-pointer place-items-center rounded-check border-2 border-field bg-surface text-on-pastel transition-colors disabled:cursor-not-allowed data-[state=checked]:border-mint data-[state=checked]:bg-mint',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center">
      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
