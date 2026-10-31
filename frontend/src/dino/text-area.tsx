import type { ComponentProps } from 'react';

import { cn } from '@/dino/cn';
import { fieldControlStates, isAriaDisabled } from '@/dino/field-control';

// Disabled is aria-disabled, never disabled, so the field stays focusable (docs/design.md, States).
type TextAreaProps = Omit<ComponentProps<'textarea'>, 'disabled'>;

// Grows with its text where the browser supports field-sizing; elsewhere it scrolls inside and can be dragged taller.
export const TextArea = ({ className, readOnly, ...props }: TextAreaProps) => (
  <textarea
    readOnly={readOnly || isAriaDisabled(props['aria-disabled'])}
    className={cn(
      'field-sizing-content block min-h-24 w-full min-w-0 resize-y wrap-break-word rounded-card border-2 border-field bg-transparent px-4.5 py-2.5 font-bold text-body text-ink transition-colors placeholder:font-semibold placeholder:text-muted supports-[field-sizing:content]:resize-none',
      ...fieldControlStates,
      className
    )}
    {...props}
  />
);
