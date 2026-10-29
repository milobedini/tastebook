import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { Loading } from '@/dino/loading';

const meta = {
  title: 'Dino/Loading',
  component: Loading,
  args: { children: 'Finding recipes…' }
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvasElement.querySelector('[aria-busy="true"]');
    await expect(region).not.toBeNull();
    await expect(region === null ? '' : getComputedStyle(region).animationDelay).toBe('0.5s');
    await waitFor(() => expect(canvas.getByRole('status')).toBeVisible());
    const status = canvas.getByRole('status');
    await expect(status).toHaveTextContent('Finding recipes…');
    await expect(status.closest('[aria-busy="true"]')).toBe(region);
  }
} satisfies Story;
