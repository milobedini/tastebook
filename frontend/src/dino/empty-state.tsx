import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export const EmptyState = ({ icon: Icon, title, children, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-2.5 px-2 py-4.5 text-center">
    <Icon aria-hidden="true" className="size-10 text-muted" />
    <h2 className="text-title">{title}</h2>
    {children && <p className="max-w-[30ch] text-muted">{children}</p>}
    {action}
  </div>
);
