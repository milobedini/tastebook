import type { AriaAttributes } from 'react';

export const isAriaDisabled = (value: AriaAttributes['aria-disabled']) => value === true || value === 'true';

// Hover, focus, invalid and disabled for every text field (docs/design.md, States).
export const fieldControlStates = [
  'hover:not-aria-invalid:not-aria-disabled:border-muted',
  'focus-visible:not-aria-invalid:border-ink focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-ink',
  'aria-invalid:border-danger',
  'aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:bg-surface aria-disabled:text-muted',
  'forced-colors:aria-disabled:border-[GrayText] forced-colors:aria-disabled:text-[GrayText]'
];
