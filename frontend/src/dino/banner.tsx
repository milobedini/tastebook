import { CircleAlert, CircleCheck, type LucideIcon, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/dino/cn';

type Tone = 'success' | 'warning' | 'danger';

const toneStyles: Record<Tone, { icon: LucideIcon; role: 'alert' | 'status'; border: string; text: string }> = {
  danger: { icon: CircleAlert, role: 'alert', border: 'border-danger', text: 'text-danger' },
  warning: { icon: TriangleAlert, role: 'status', border: 'border-warning', text: 'text-warning' },
  success: { icon: CircleCheck, role: 'status', border: 'border-success', text: 'text-success' }
};

type BannerProps = {
  tone: Tone;
  title: string;
  children?: ReactNode;
};

export const Banner = ({ tone, title, children }: BannerProps) => {
  const { icon: Icon, role, border, text } = toneStyles[tone];

  return (
    <div
      role={role}
      className={cn(
        'grid grid-cols-[1.375rem_minmax(0,1fr)] gap-2.5 rounded-note border-2 bg-surface px-3.5 py-3',
        border
      )}
    >
      <Icon aria-hidden="true" className={cn('size-5.5', text)} />
      <div className="flex flex-col">
        <p className="font-bold">{title}</p>
        {children}
      </div>
    </div>
  );
};
