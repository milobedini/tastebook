import { type ReactNode, useId } from 'react';

import { Checkbox } from '@/ui/checkbox';
import { cn } from '@/ui/cn';

type CheckboxRowProps = {
  children: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export const CheckboxRow = ({ children, checked, onCheckedChange }: CheckboxRowProps) => {
  const id = useId();

  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 border-line border-b">
      <Checkbox id={id} checked={checked} onCheckedChange={(state) => onCheckedChange(state === true)} />
      <span className={cn(checked && 'text-muted line-through')}>{children}</span>
    </label>
  );
};
