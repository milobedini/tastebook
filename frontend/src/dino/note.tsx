import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/dino/cn';

type NoteAction = { label: string; onClick: () => void };

type NoteProps = {
  children: ReactNode;
  icon?: LucideIcon;
  // At most one action (docs/design.md, Components), so it's a single object, not a slot.
  action?: NoteAction;
};

export const Note = ({ children, icon: Icon, action }: NoteProps) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-note border-2 border-transparent bg-butter text-on-pastel',
      action ? 'py-2 pr-2.5 pl-3.5' : 'px-3.5 py-2.5'
    )}
  >
    {Icon && <Icon aria-hidden="true" strokeWidth={2.5} className="size-4.5 shrink-0" />}
    <p className="min-w-0 grow">{children}</p>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-pill border-2 border-on-pastel bg-transparent px-5 text-label text-on-pastel transition hover:bg-on-pastel/10 focus-visible:outline-on-pastel active:scale-97 active:bg-on-pastel/20"
      >
        {action.label}
      </button>
    )}
  </div>
);
