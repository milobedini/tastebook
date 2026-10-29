import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@/dino/button';
import { Toaster, toast } from '@/dino/sonner';

const showToast = () =>
  toast('Saved to Favourites', {
    action: { label: 'Undo', onClick: () => undefined },
    // Stays until dismissed, so the screenshot doesn't race Sonner's 4 s timer.
    duration: Number.POSITIVE_INFINITY
  });

const showError = () =>
  toast.error('Couldn’t save. You’re offline.', {
    action: { label: 'Try again', onClick: () => undefined },
    duration: Number.POSITIVE_INFINITY
  });

const meta = {
  title: 'Dino/Toast',
  component: Toaster,
  // Sonner replays every toast still showing to a newly mounted Toaster, so each story starts with none.
  beforeEach: () => {
    toast.dismiss();
  },
  render: (args) => (
    <>
      <Toaster {...args} />
      <div className="flex flex-wrap gap-2.5">
        <Button variant="secondary" onClick={showToast}>
          Show a toast
        </Button>
        <Button variant="secondary" onClick={showError}>
          Show an error
        </Button>
      </div>
    </>
  )
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Show a toast' }));
    // The toast slides in, so it's visible once the animation has started.
    await waitFor(() => expect(canvas.getByText('Saved to Favourites')).toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(canvas.getByText('Saved to Favourites').closest('[data-sonner-toast]')).toHaveStyle({
      transitionDuration: '0.15s',
      backgroundColor: 'rgb(255, 244, 234)',
      borderTopWidth: '2px',
      borderTopColor: 'rgba(0, 0, 0, 0)'
    });
  }
} satisfies Story;
// Only the toast's action is forced, so the "Show a toast" button keeps its resting look.
export const IsHover = { ...Default, parameters: { pseudo: { hover: ['[data-button]'] } } } satisfies Story;
export const IsPressed = { ...Default, parameters: { pseudo: { active: ['[data-button]'] } } } satisfies Story;
export const IsFocus = { ...Default, parameters: { pseudo: { focusVisible: ['[data-button]'] } } } satisfies Story;
// Exported as Error under another name, since a binding called Error would shadow the global.
const ErrorStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Show an error' }));
    const message = canvas.getByText('Couldn’t save. You’re offline.');
    await waitFor(() => expect(message).toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible();
    const toastElement = message.closest('[data-sonner-toast]');
    await expect(toastElement?.querySelector('svg')).toBeInTheDocument();
    await expect(toastElement).toHaveStyle({ backgroundColor: 'rgb(255, 244, 234)' });
  }
} satisfies Story;

export { ErrorStory as Error };
