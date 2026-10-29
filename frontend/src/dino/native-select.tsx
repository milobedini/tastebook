import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/dino/cn';

export const NativeSelect = ({ className, ...props }: ComponentProps<'select'>) => (
  <div className="relative">
    <select
      className={cn(
        'h-11 w-full min-w-0 cursor-pointer appearance-none rounded-pill border border-field bg-surface pr-10 pl-3 text-body text-ink disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted aria-invalid:border-2 aria-invalid:border-danger',
        className
      )}
      {...props}
    />
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 size-4.5 -translate-y-1/2 text-muted"
    />
  </div>
);
