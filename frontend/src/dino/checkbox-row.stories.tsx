import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { CheckboxRow } from '@/dino/checkbox-row';
import { isHover, isPressed } from '@/dino/story-states';

const meta = {
  title: 'Dino/CheckboxRow',
  component: CheckboxRow,
  args: {
    children: 'Dried chickpeas',
    amount: '250 g',
    checked: false,
    onCheckedChange: fn()
  }
} satisfies Meta<typeof CheckboxRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return <CheckboxRow {...args} checked={checked} onCheckedChange={setChecked} />;
  },
  play: async ({ canvasElement }) => {
    const checkbox = within(canvasElement).getByRole('checkbox', { name: 'Dried chickpeas 250 g' });
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  }
} satisfies Story;
export const IsOn = { args: { checked: true } } satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: ['button[role="checkbox"]'] } } } satisfies Story;
