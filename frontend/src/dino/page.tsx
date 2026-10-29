import type { ReactNode } from 'react';

type PageProps = { children: ReactNode };

// The insets are 0 outside a notched phone, so the usual padding still applies; viewport-fit=cover in index.html
// is what makes the browser report them.
export const Page = ({ children }: PageProps) => (
  <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-[max(--spacing(8),env(safe-area-inset-top))] pr-[max(--spacing(4),env(safe-area-inset-right))] pb-[max(--spacing(8),env(safe-area-inset-bottom))] pl-[max(--spacing(4),env(safe-area-inset-left))]">
    {children}
  </main>
);
