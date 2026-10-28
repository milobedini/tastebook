import { X } from 'lucide-react';

type RemovableChipProps = { children: string; onRemove: () => void };

export const RemovableChip = ({ children, onRemove }: RemovableChipProps) => (
  <button
    type="button"
    aria-label={`Remove filter: ${children}`}
    onClick={onRemove}
    className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border border-cobalt bg-cobalt px-3.5 font-bold text-on-cobalt text-small"
  >
    {children}
    <X aria-hidden="true" className="size-4" />
  </button>
);
