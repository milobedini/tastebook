import { X } from 'lucide-react';

import { cn } from '@/ui/cn';

const looks = {
  filled: 'border-cobalt bg-cobalt text-on-cobalt',
  outline: 'border-cobalt bg-surface text-cobalt'
};

type RemovableChipProps = { children: string; onRemove: () => void; look?: keyof typeof looks };

export const RemovableChip = ({ children, onRemove, look = 'filled' }: RemovableChipProps) => (
  <button
    type="button"
    aria-label={`Remove filter: ${children}`}
    onClick={onRemove}
    className={cn(
      'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border px-3.5 font-bold text-small',
      looks[look]
    )}
  >
    {children}
    <X aria-hidden="true" className="size-4" />
  </button>
);
