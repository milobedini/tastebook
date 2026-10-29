import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ServingsStepper } from '@/dino/servings-stepper';
import { isHover } from '@/dino/story-states';

const moreServings = 'button[aria-label="More servings"]';

const meta = {
  title: 'Dino/ServingsStepper',
  component: ServingsStepper,
  args: { value: 4, min: 1, max: 12, onValueChange: fn() }
} satisfies Meta<typeof ServingsStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

const Stateful = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <ServingsStepper {...args} value={value} onValueChange={setValue} />;
  }
} satisfies Story;

export const Default = {
  ...Stateful,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = canvas.getByRole('button', { name: 'More servings' });
    await userEvent.click(more);
    await expect(canvas.getByText('Serves 5')).toBeVisible();
    const fewer = canvas.getByRole('button', { name: 'Fewer servings' });
    await userEvent.click(fewer);
    await userEvent.click(fewer);
    await userEvent.click(fewer);
    await userEvent.click(fewer);
    await expect(canvas.getByText('Serves 1')).toBeVisible();
    await expect(fewer).toHaveAttribute('aria-disabled', 'true');
    await expect(more).not.toHaveAttribute('aria-disabled');
    await userEvent.click(fewer);
    await expect(canvas.getByText('Serves 1')).toBeVisible();
    await expect(fewer).toHaveFocus();
  }
} satisfies Story;
export const Yield = {
  ...Stateful,
  args: { value: 16, max: 24, yieldUnit: 'cookies' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Make more' }));
    await expect(canvas.getByText('Makes 17 cookies')).toBeVisible();
  }
} satisfies Story;
export const AtMinimum = { ...Stateful, args: { value: 1 } } satisfies Story;
export const AtMaximum = {
  ...Stateful,
  args: { value: 12 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = canvas.getByRole('button', { name: 'More servings' });
    await userEvent.click(more);
    await expect(canvas.getByText('Serves 12')).toBeVisible();
    await expect(more).toHaveAttribute('aria-disabled', 'true');
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: { pseudo: { active: [moreServings] } } } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: [moreServings] } } } satisfies Story;
