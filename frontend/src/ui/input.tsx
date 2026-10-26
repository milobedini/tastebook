import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/ui/cn';

export const Input = ({ className, type = 'text', ...props }: ComponentProps<'input'>) => (
  <input
    type={type}
    className={cn(
      'h-11 w-full min-w-0 rounded-field border border-field bg-surface px-3 text-body text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted aria-invalid:border-2 aria-invalid:border-danger',
      className
    )}
    {...props}
  />
);

export const SearchInput = ({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) => (
  <div className="relative">
    <Search
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted"
    />
    <Input type="search" className={cn('rounded-pill pl-10', className)} {...props} />
  </div>
);
