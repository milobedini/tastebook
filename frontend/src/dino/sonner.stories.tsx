import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@/dino/button';
import { Toaster, toast } from '@/dino/sonner';

const showToast = () => toast('Saved to Favourites', { action: { label: 'Undo', onClick: () => undefined } });

const meta = {
  title: 'Dino/Toast',
  component: Toaster,
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button variant="secondary" onClick={showToast}>
        Show a toast
      </Button>
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
  }
} satisfies Story;
