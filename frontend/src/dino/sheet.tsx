import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { KeyboardEvent, PointerEvent, ReactElement, ReactNode, Ref } from 'react';
import { useState } from 'react';

import { cn } from '@/dino/cn';
import { IconButton } from '@/dino/icon-button';

const fade =
  'duration-150 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0';

// The share of its height a sheet has to be dragged down to close, as phone sheets commonly do.
const closingShare = 0.25;

type SheetPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  close: () => void;
  // Radix's portal hands its presence a ref, so it can wait for the slide out before unmounting.
  ref?: Ref<HTMLDivElement>;
};

// Its own component so the drag starts afresh each time the sheet opens: Radix unmounts it once it has closed.
const SheetPanel = ({ title, description, children, close, ref }: SheetPanelProps) => {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  // Radix hears Escape on the document before the focused control does, so a control that handles Escape itself
  // (a combobox closing its list) couldn't keep the sheet open. Radix's handler is turned off, and the sheet closes
  // only on an Escape that bubbles up to it: a control that handles one stops it on the way.
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStartY(event.clientY);
  };
  const followDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY === null) return;
    setOffset(Math.max(0, event.clientY - dragStartY));
  };
  // A closing sheet keeps its offset: the slide out has no start of its own, so it carries on from there.
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY === null) return;
    const dragged = Math.max(0, event.clientY - dragStartY);
    const height = event.currentTarget.parentElement?.offsetHeight ?? 0;
    setDragStartY(null);
    if (dragged > 0 && dragged >= height * closingShare) {
      setOffset(dragged);
      close();
    } else {
      setOffset(0);
    }
  };
  const cancelDrag = () => {
    setDragStartY(null);
    setOffset(0);
  };

  return (
    <Dialog.Content
      ref={ref}
      // Radix warns about a missing description unless told there is none; with one, keep its own link.
      {...(description === undefined && { 'aria-describedby': undefined })}
      onEscapeKeyDown={(event) => event.preventDefault()}
      onKeyDown={closeOnEscape}
      style={offset > 0 ? { transform: `translateY(${offset}px)` } : undefined}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-sheet border-2 border-transparent border-b-0 bg-surface px-4.5 pt-1.5 pb-6 text-ink shadow-lift duration-150 ease-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        dragStartY === null ? 'transition-transform' : 'transition-none'
      )}
    >
      {/* The sheet's top 24 px, handle included: a pointer shortcut, since Escape and Close serve the keyboard. */}
      <div
        aria-hidden="true"
        data-slot="sheet-grab"
        onPointerDown={startDrag}
        onPointerMove={followDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
        className="absolute inset-x-0 top-0 h-6 cursor-grab touch-none select-none active:cursor-grabbing"
      />
      <span
        aria-hidden="true"
        className="mx-auto h-1.25 w-10 shrink-0 rounded-pill bg-field forced-colors:bg-[CanvasText]"
      />
      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Dialog.Title className="text-display-l">{title}</Dialog.Title>
          {description && <Dialog.Description className="text-muted">{description}</Dialog.Description>}
        </div>
        <Dialog.Close asChild>
          <IconButton icon={X} label="Close" />
        </Dialog.Close>
      </div>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </Dialog.Content>
  );
};

type SheetProps = {
  trigger: ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
  // Optional, so a sheet's own action (like "Add 10 things") can close it; uncontrolled without them.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const Sheet = ({ trigger, title, description, children, open, onOpenChange }: SheetProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay data-slot="sheet-scrim" className={cn('fixed inset-0 z-50 bg-scrim', fade)} />
        <SheetPanel title={title} description={description} close={() => setOpen(false)}>
          {children}
        </SheetPanel>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
