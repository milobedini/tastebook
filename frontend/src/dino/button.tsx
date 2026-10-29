import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/dino/cn';

const buttonVariants = cva(
  'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-pill border-2 border-transparent px-5 font-bold text-body no-underline transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface disabled:text-muted [&_svg]:pointer-events-none [&_svg]:size-4.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-peach text-on-pastel',
        secondary: 'border-field bg-transparent text-ink',
        ghost: 'bg-transparent text-ink hover:bg-surface',
        danger: 'bg-danger text-on-danger'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
);

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = ({ className, variant, asChild = false, type = 'button', ...props }: ButtonProps) => {
  const Comp = asChild ? Slot.Root : 'button';

  return <Comp type={asChild ? undefined : type} className={cn(buttonVariants({ variant }), className)} {...props} />;
};
