import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ErrorWithRetry } from '@/dino/error-with-retry';

const meta = {
  title: 'Dino/ErrorWithRetry',
  component: ErrorWithRetry,
  args: {
    title: 'Couldn’t load recipes',
    children: 'Check your connection, then try again.',
    onRetry: fn(async () => undefined)
  }
} satisfies Meta<typeof ErrorWithRetry>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent('Couldn’t load recipes');
    await expect(alert).toHaveTextContent('Check your connection, then try again.');
    const button = canvas.getByRole('button', { name: 'Try again' });
    await expect(button).toHaveAccessibleDescription('Couldn’t load recipes');
    await userEvent.click(button);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    const again = await canvas.findByRole('button', { name: 'Try again' });
    await expect(again).not.toHaveAttribute('aria-busy');
  }
} satisfies Story;

export const IsRetrying = {
  args: { onRetry: fn(() => new Promise<never>(() => {})) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    const trying = await canvas.findByRole('button', { name: 'Trying…' });
    await expect(trying).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(trying);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn’t load recipes');
  }
} satisfies Story;
