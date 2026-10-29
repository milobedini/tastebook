import type { ReactNode } from 'react';

import { cn } from '@/dino/cn';

type SquiggleProps = {
  children: ReactNode;
  // The word itself turns italic and Pop, as browse's "cook": Display XL allows one italic word.
  emphasis?: boolean;
};

// The board's wave, 38 px a period, repeated past 400 px and cut to the word's width, so one path serves any word.
const wave =
  'M2 7c7-5 12-5 19 0s12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0 12-5 19 0 12 5 19 0';

// Drawn in currentColor. An SVG with its own colour keeps it under forced colours, so there it takes the text's.
export const Squiggle = ({ children, emphasis = false }: SquiggleProps) => (
  <span className={cn('relative inline-block max-w-full', emphasis && 'text-pop italic')}>
    {children}
    <svg
      aria-hidden="true"
      viewBox="0 0 400 12"
      preserveAspectRatio="xMinYMid slice"
      className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full text-pop forced-colors:text-current"
    >
      <path d={wave} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </span>
);
