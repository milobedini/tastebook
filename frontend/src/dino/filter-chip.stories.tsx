import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { FilterChip } from '@/dino/filter-chip';
import { isFocus, isHover, isPressed } from '@/dino/story-states';

const meta = {
  title: 'Dino/FilterChip',
  component: FilterChip,
  args: { children: 'Under 30 min', pressed: false, onPressedChange: fn() }
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  render: (args) => {
    const [pressed, setPressed] = useState(args.pressed);
    return <FilterChip {...args} pressed={pressed} onPressedChange={setPressed} />;
  },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Under 30 min' });
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
export const IsOn = { args: { pressed: true } } satisfies Story;
export const IsOnIsHover = { args: { pressed: true }, parameters: isHover } satisfies Story;
export const IsOnIsPressed = { args: { pressed: true }, parameters: isPressed } satisfies Story;
