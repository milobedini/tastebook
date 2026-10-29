import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timer } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Note } from '@/dino/note';
import { isFocus, isHover, isPressed } from '@/dino/story-states';

const meta = {
  title: 'Dino/Note',
  component: Note,
  args: {
    children: 'Left out salt, water and vegetable oil: you probably have them.',
    action: { label: 'Add them', onClick: fn() }
  }
} satisfies Meta<typeof Note>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Add them' });
    await userEvent.click(button);
    await expect(args.action?.onClick).toHaveBeenCalledTimes(1);

    const panel = canvas.getByText('Left out salt, water and vegetable oil: you probably have them.').parentElement;
    await expect(panel).toHaveStyle({
      backgroundColor: 'rgb(255, 224, 138)',
      borderTopWidth: '2px',
      borderTopColor: 'rgba(0, 0, 0, 0)'
    });
    await expect(button).toHaveStyle({ borderTopColor: 'rgb(42, 20, 64)', color: 'rgb(42, 20, 64)' });
  }
} satisfies Story;
export const WithIcon = {
  args: { children: 'Start the night before: the chickpeas soak for 12 hours.', icon: Timer, action: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByText('Start the night before: the chickpeas soak for 12 hours.');
    await expect(text).toBeVisible();
    await expect(text.parentElement?.querySelectorAll('svg')).toHaveLength(1);
    await expect(canvas.queryByRole('button')).toBeNull();
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
