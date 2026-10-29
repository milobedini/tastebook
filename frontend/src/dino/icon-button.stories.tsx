import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { IconButton } from '@/dino/icon-button';
import { isFocus, isHover, isPressed } from '@/dino/story-states';

const meta = {
  title: 'Dino/IconButton',
  component: IconButton,
  args: { icon: Heart, label: 'Favourite', pressed: false, onClick: fn() }
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  render: (args) => {
    const [pressed, setPressed] = useState(args.pressed);
    return <IconButton {...args} pressed={pressed} onClick={() => setPressed(!pressed)} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Favourite' }));
    await expect(canvas.getByRole('button', { name: 'Favourite' })).toHaveAttribute('aria-pressed', 'true');
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
export const IsDisabled = { args: { disabled: true } } satisfies Story;
export const IsOn = { args: { pressed: true } } satisfies Story;
