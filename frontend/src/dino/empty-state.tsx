import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  // Why it's empty: docs/design.md, Voice.
  children: ReactNode;
  // The doodle's arrow points at the action, so a doodle needs one.
} & ({ action?: undefined; doodle?: undefined } | { action: ReactNode; doodle?: string });

type DoodleProps = { note: string };

// Shown only when its row is at least 16rem wide, so it never overflows at 320 px or at large text.
const Doodle = ({ note }: DoodleProps) => (
  <div aria-hidden="true" className="@3xs:flex hidden flex-col items-start gap-0.5 text-muted">
    <span className="-rotate-5 font-serif text-caption italic">{note}</span>
    <svg viewBox="0 0 70 60" aria-hidden="true" className="h-12 w-14 -scale-x-100 rotate-20">
      <path
        d="M8 6c20 4 38 18 44 40M44 40l8 8 6-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const EmptyState = ({ title, children, action, doodle }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-card border border-line px-6 py-7 text-center">
    <span
      aria-hidden="true"
      className="flex h-23 w-24 -rotate-4 items-start justify-center border-[2.5px] border-field border-dashed pt-2 large-text:rotate-0"
    >
      <span className="h-13.5 w-18.5 border-2 border-line border-dashed" />
    </span>
    <h2>{title}</h2>
    <p className="max-w-[30ch] text-muted">{children}</p>
    {action !== undefined && (
      <div className="@container mt-1 w-full">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <div className="col-start-2">{action}</div>
          {doodle !== undefined && <Doodle note={doodle} />}
        </div>
      </div>
    )}
  </div>
);
