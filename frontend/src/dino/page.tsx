import type { ReactNode } from 'react';

type PageProps = { children: ReactNode };

// The insets are 0 outside a notched phone, so the usual padding still applies; viewport-fit=cover in index.html
// is what makes the browser report them. The top inset is the top bar's, which sits above.
export const Page = ({ children }: PageProps) => (
  <main className="mx-auto flex w-full max-w-300 flex-col gap-6 pt-6 pr-[max(--spacing(5),env(safe-area-inset-right))] pb-[max(--spacing(12),env(safe-area-inset-bottom))] pl-[max(--spacing(5),env(safe-area-inset-left))] sm:pt-8 sm:pr-[max(--spacing(8),env(safe-area-inset-right))] sm:pl-[max(--spacing(8),env(safe-area-inset-left))]">
    {children}
  </main>
);
