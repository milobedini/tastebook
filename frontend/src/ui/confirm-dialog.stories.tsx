import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/ui/confirm-dialog';

const meta = {
  title: 'Dino/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    trigger: <Button variant="danger">Delete account</Button>,
    title: 'Delete your account?',
    description:
      'Your 12 private recipes will be deleted. Your 3 public recipes stay, credited to "a former member", so people who saved them keep them.',
    confirmLabel: 'Delete account',
    onConfirm: fn()
  }
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const Open = {
  play: async ({ canvasElement }) => {
    // The dialog is portalled to the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole('button', { name: 'Delete account' });

    await userEvent.click(trigger);
    const dialog = body.getByRole('alertdialog', { name: 'Delete your account?' });
    // It fades in, so it's visible once the animation has started.
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();

    // Opened again, so the story ends on the open dialog for axe and the 44 px check.
    await userEvent.click(trigger);
    const reopened = body.getByRole('alertdialog', { name: 'Delete your account?' });
    await waitFor(() => expect(reopened).toBeVisible());
  }
} satisfies Story;
