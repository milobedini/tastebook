import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Avatar } from '@/dino/avatar';

const meta = {
  title: 'Dino/Avatar',
  component: Avatar,
  args: { name: 'Milo Bedini' }
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent(/^M$/);
  }
} satisfies Story;

export const IsLowerCase = {
  args: { name: '  émile' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent(/^É$/);
  }
} satisfies Story;

export const IsWithoutName = {
  args: { name: ' ' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).not.toBeNull();
    await expect(canvasElement.textContent).toBe('');
  }
} satisfies Story;
