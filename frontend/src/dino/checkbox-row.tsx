import { type ReactNode, useId } from 'react';

import { Checkbox } from '@/dino/checkbox';
import { cn } from '@/dino/cn';

type CheckboxRowProps = {
  children: ReactNode;
  amount?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export const CheckboxRow = ({ children, amount, checked, onCheckedChange }: CheckboxRowProps) => {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="group -mx-2 flex min-h-12 cursor-pointer items-center gap-3.5 rounded-row border-line border-b px-2 text-body hover:bg-surface has-focus-visible:outline-3 has-focus-visible:outline-ink has-focus-visible:-outline-offset-1"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(state) => onCheckedChange(state === true)}
        // The row carries the focus ring, so the box doesn't draw its own.
        className="focus-visible:outline-none group-active:scale-88"
      />
      <span className={cn('grow', checked && 'text-muted line-through decoration-2')}>{children}</span>
      {amount && (
        <>
          {' '}
          <span
            className={cn('font-extrabold tabular-nums', checked && 'font-bold text-muted line-through decoration-2')}
          >
            {amount}
          </span>
        </>
      )}
    </label>
  );
};
