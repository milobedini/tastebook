import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

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
    const iconFill = () =>
      getComputedStyle(canvas.getByRole('button', { name: 'Favourite' }).querySelector('svg') as SVGElement).fill;
    await expect(iconFill()).toBe('none');
    await userEvent.click(canvas.getByRole('button', { name: 'Favourite' }));
    await expect(canvas.getByRole('button', { name: 'Favourite' })).toHaveAttribute('aria-pressed', 'true');
    // The colour transitions over 120 ms, and the icon's fill follows it.
    await waitFor(() => expect(iconFill()).toBe('rgb(42, 20, 64)'));
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
export const IsDisabled = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Favourite' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  }
} satisfies Story;
export const IsOn = { args: { pressed: true } } satisfies Story;
export const IsOnIsHover = { args: { pressed: true }, parameters: isHover } satisfies Story;
export const IsOnIsPressed = { args: { pressed: true }, parameters: isPressed } satisfies Story;
export const Large = {
  args: { size: 'large' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Favourite' });
    await expect(button.offsetHeight).toBe(48);
    await expect(button.offsetWidth).toBe(48);
  }
} satisfies Story;
