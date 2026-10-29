import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/dino/cn';

// label is required, so an icon-only button without an accessible name doesn't compile.
type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  pressed?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'aria-pressed'>;

export const IconButton = ({ icon: Icon, label, pressed, className, ...props }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={pressed}
    className={cn(
      'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-pill border border-field bg-surface text-ink transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-chip disabled:text-muted aria-pressed:border-cobalt aria-pressed:bg-cobalt aria-pressed:text-on-cobalt',
      className
    )}
    {...props}
  >
    <Icon aria-hidden="true" className="size-5" />
  </button>
);
