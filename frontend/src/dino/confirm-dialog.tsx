import { AlertDialog } from 'radix-ui';
import type { ReactElement } from 'react';

import { AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/dino/alert-dialog';
import { Button } from '@/dino/button';

type ConfirmDialogProps = {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export const ConfirmDialog = ({ trigger, title, description, confirmLabel, onConfirm }: ConfirmDialogProps) => (
  <AlertDialog.Root>
    <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
    <AlertDialogContent>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
      <div className="flex flex-wrap justify-end gap-2">
        <AlertDialog.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action asChild>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </AlertDialog.Action>
      </div>
    </AlertDialogContent>
  </AlertDialog.Root>
);
