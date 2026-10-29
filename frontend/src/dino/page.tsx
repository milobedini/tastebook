import type { ReactNode } from 'react';

type PageProps = { children: ReactNode };

export const Page = ({ children }: PageProps) => (
  <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">{children}</main>
);
