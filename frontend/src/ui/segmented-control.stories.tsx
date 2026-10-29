import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SegmentedControl } from '@/ui/segmented-control';

type Units = 'metric' | 'us';

const options: { value: Units; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'us', label: 'US' }
];

const meta = {
  title: 'Dino/SegmentedControl',
  component: SegmentedControl<Units>,
  args: { label: 'Units', options, value: 'metric', onValueChange: fn() }
} satisfies Meta<typeof SegmentedControl<Units>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvasElement, step }) => {
    const group = within(within(canvasElement).getByRole('group', { name: 'Units' }));
    const metric = group.getByRole('button', { name: 'Metric' });
    const us = group.getByRole('button', { name: 'US' });

    await step('Press US', async () => {
      await userEvent.click(us);
      await expect(us).toHaveAttribute('aria-pressed', 'true');
      await expect(metric).toHaveAttribute('aria-pressed', 'false');
    });

    // Today's keyboard model: two tab stops and no arrow keys.
    await step('Choose with the keyboard', async () => {
      await userEvent.click(metric);
      us.blur();
      metric.blur();
      await userEvent.tab();
      await expect(metric).toHaveFocus();
      await userEvent.tab();
      await expect(us).toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(us).toHaveAttribute('aria-pressed', 'true');
    });
  }
} satisfies Story;
export const IsHover = { parameters: { pseudo: { hover: ['button[aria-pressed="false"]'] } } } satisfies Story;
export const IsPressed = { parameters: { pseudo: { active: ['button[aria-pressed="false"]'] } } } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: ['button[aria-pressed="true"]'] } } } satisfies Story;
