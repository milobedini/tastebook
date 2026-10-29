import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { RemovableChip } from '@/ui/removable-chip';
import { isFocus, isHover, isPressed } from '@/ui/story-states';

const meta = {
  title: 'Dino/RemovableChip',
  component: RemovableChip,
  args: { children: 'Italian', look: 'filled', onRemove: fn() }
} satisfies Meta<typeof RemovableChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Remove filter: Italian' }));
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  }
} satisfies Story;
export const Outline = { args: { children: 'With all of these', look: 'outline' } } satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
