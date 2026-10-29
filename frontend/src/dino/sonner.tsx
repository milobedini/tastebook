import { CircleAlert } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// Sonner injects its own font and 400 ms transitions at load, so the important modifier makes Picnic's win whatever
// the stylesheet order.
export const Toaster = (props: ToasterProps) => (
  <Sonner
    className="font-sans! duration-150! ease-out!"
    icons={{ error: <CircleAlert aria-hidden="true" strokeWidth={2.5} className="size-4.5" /> }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          'flex min-h-14 w-full items-center gap-3 rounded-pill border-2 border-transparent bg-dock py-1 pr-1 pl-4.5 text-label text-on-dock shadow-lift duration-150! ease-out! *:duration-150!',
        icon: 'shrink-0',
        content: 'min-w-0 grow',
        actionButton:
          'min-h-11 shrink-0 cursor-pointer rounded-pill border-2 border-on-dock bg-transparent px-4 text-label text-on-dock transition hover:bg-on-dock/10 focus-visible:outline-on-dock active:scale-97 active:bg-on-dock/20'
      }
    }}
    {...props}
  />
);

export { toast } from 'sonner';
