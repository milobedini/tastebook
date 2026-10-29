import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { RemovableChip } from '@/dino/removable-chip';
import { isFocus, isHover, isPressed } from '@/dino/story-states';

const meta = {
  title: 'Dino/RemovableChip',
  component: RemovableChip,
  args: { children: 'Italian', look: 'filled', onRemove: fn() }
} satisfies Meta<typeof RemovableChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled = {
  play: async ({ args, canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Remove filter: Italian' });
    await userEvent.click(chip);
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    await expect(chip).toHaveStyle({ backgroundColor: 'rgb(143, 227, 192)' });
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;

const outline = { children: 'With all of these', look: 'outline' } as const;

export const Outline = {
  args: outline,
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Remove filter: With all of these' });
    await expect(chip).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0)', borderTopColor: 'rgb(143, 127, 176)' });
  }
} satisfies Story;
export const OutlineIsHover = { args: outline, parameters: isHover } satisfies Story;
export const OutlineIsPressed = { args: outline, parameters: isPressed } satisfies Story;
export const OutlineIsFocus = { args: outline, parameters: isFocus } satisfies Story;
