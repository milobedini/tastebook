import { X } from 'lucide-react';

import { cn } from '@/dino/cn';

const looks = {
  filled: 'border-transparent bg-mint pr-4 pl-3 text-on-pastel hover:bg-mint-hover active:bg-mint-pressed',
  outline:
    'border-field bg-transparent px-4 text-ink hover:border-ink hover:bg-surface active:border-ink active:bg-line'
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
      'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border-2 text-label transition active:scale-96',
      looks[look]
    )}
  >
    {children}
    <X aria-hidden="true" className="size-4" strokeWidth={3} />
  </button>
);
