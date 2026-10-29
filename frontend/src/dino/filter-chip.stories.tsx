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
    await expect(chip).toHaveStyle({ rotate: 'none' });
    await expect(chip.querySelector('svg')).toBeNull();
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(chip.querySelectorAll('svg')).toHaveLength(1);
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(chip.querySelector('svg')).toBeNull();
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
export const IsOn = {
  args: { pressed: true },
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Under 30 min' });
    await expect(chip).toHaveStyle({ backgroundColor: 'rgb(143, 227, 192)' });
    await expect(chip.querySelector('svg')).not.toBeNull();
  }
} satisfies Story;
export const IsOnIsHover = { args: { pressed: true }, parameters: isHover } satisfies Story;
export const IsOnIsPressed = { args: { pressed: true }, parameters: isPressed } satisfies Story;

const TiltedChip = ({ label, tilt, on = false }: { label: string; tilt: 'left' | 'right'; on?: boolean }) => {
  const [pressed, setPressed] = useState(on);
  return (
    <FilterChip pressed={pressed} onPressedChange={setPressed} tilt={tilt}>
      {label}
    </FilterChip>
  );
};

export const Tilted = {
  render: () => (
    <div className="flex gap-2">
      <TiltedChip label="Quick" tilt="left" on />
      <TiltedChip label="Veggie" tilt="right" />
      <TiltedChip label="One-pot" tilt="left" />
      <TiltedChip label="Sweet" tilt="right" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Quick' })).toHaveStyle({ rotate: '-1.5deg' });
    await expect(canvas.getByRole('button', { name: 'Veggie' })).toHaveStyle({ rotate: '1.5deg' });
  }
} satisfies Story;
