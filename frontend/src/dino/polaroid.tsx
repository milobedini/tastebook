import type { ReactNode } from 'react';

import { cn } from '@/dino/cn';

export type Lean = 'left' | 'right';
type Frame = 'small' | 'large';

type PolaroidProps = { frame: Frame; lean: Lean; tape?: boolean; children: ReactNode };

// small: list polaroids, whose caption brings its own bottom padding; large: the recipe's photo.
const frameStyles: Record<Frame, string> = { small: 'px-2 pt-2', large: 'p-2.5' };
// One tilt, so hover (a third of it), pressed (two thirds) and large text (none) all derive from it.
const leanStyles: Record<Lean, string> = { left: '[--tilt:-3deg]', right: '[--tilt:3deg]' };

// group-* answers to a Polaroid card's link; a polaroid outside a card has no group and never moves.
export const Polaroid = ({ frame, lean, tape = false, children }: PolaroidProps) => (
  <div
    className={cn(
      'flex rotate-(--tilt) flex-col bg-paper text-on-pastel shadow-lift transition large-text:[--tilt:0deg]',
      'group-hover:-translate-y-1 group-hover:rotate-[calc(var(--tilt)/3)] group-hover:shadow-lift-hover',
      'group-active:scale-98 group-active:rotate-[calc(var(--tilt)*2/3)] group-active:shadow-lift-pressed',
      frameStyles[frame],
      leanStyles[lean],
      tape && 'relative'
    )}
  >
    {/* The board's tape: 72 × 22 px, centred, half of it over the frame's top edge. */}
    {tape && <span aria-hidden="true" className="absolute -top-2.75 left-1/2 h-5.5 w-18 -translate-x-1/2 bg-tape" />}
    {children}
  </div>
);
