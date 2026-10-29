import { X } from 'lucide-react';

import { cn } from '@/dino/cn';

const looks = {
  filled: 'border-mint bg-mint text-on-pastel',
  outline: 'border-field bg-surface text-ink'
};

type RemovableChipProps = {
  children: string;
  onRemove: () => void;
  look?: keyof typeof looks;
  removeLabel?: string;
};

export const RemovableChip = ({
  children,
  onRemove,
  look = 'filled',
  removeLabel = 'Remove filter'
}: RemovableChipProps) => (
  <button
    type="button"
    aria-label={`${removeLabel}: ${children}`}
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
