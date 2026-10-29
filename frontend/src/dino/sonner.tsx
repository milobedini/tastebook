import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = (props: ToasterProps) => (
  <Sonner
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          'flex w-full items-center justify-between gap-3 rounded-field bg-ink py-2.5 pr-2.5 pl-3.5 font-bold text-ground',
        actionButton: 'min-h-11 cursor-pointer px-2.5 font-bold text-ground underline'
      }
    }}
    {...props}
  />
);

export { toast } from 'sonner';
