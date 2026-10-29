import { cn } from '@/dino/cn';
import type { Lean } from '@/dino/polaroid';

const leanStyles: Record<Lean, string> = { left: '-rotate-3', right: 'rotate-3' };

type BlankPolaroidProps = { lean: Lean };

// The transparent border is what forced colours draws. Nothing on it moves (docs/design.md, States › Loading).
const BlankPolaroid = ({ lean }: BlankPolaroidProps) => (
  <span
    className={cn(
      'flex w-30 flex-col border-2 border-transparent bg-surface px-2 pt-2 pb-2.5 large-text:rotate-0',
      leanStyles[lean]
    )}
  >
    <span className="block aspect-4/3 bg-line" />
    <span className="mt-2 block h-2.5 w-16 rounded-pill bg-line" />
  </span>
);

const Spinner = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4.5 animate-spin motion-reduce:animate-none">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

type LoadingProps = {
  // What's happening, as an "-ing" line: "Finding recipes…".
  children: string;
};

export const Loading = ({ children }: LoadingProps) => (
  <div aria-busy="true" className="flex animate-reveal flex-col gap-4">
    <div aria-hidden="true" className="flex gap-4.5 px-1 pt-1.5">
      <BlankPolaroid lean="left" />
      <BlankPolaroid lean="right" />
    </div>
    <p role="status" className="flex items-center gap-2.5 text-label">
      <Spinner />
      {children}
    </p>
  </div>
);
