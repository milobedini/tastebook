import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { SegmentedControl } from '@/dino/segmented-control';

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
    const metric = group.getByRole('radio', { name: 'Metric' });
    const us = group.getByRole('radio', { name: 'US' });

    await step('Choose US', async () => {
      await userEvent.click(us);
      await expect(us).toBeChecked();
      await expect(metric).not.toBeChecked();
      await expect(us.closest('label')?.querySelector('svg')).not.toBeNull();
      await expect(metric.closest('label')?.querySelector('svg')).toBeNull();
    });

    await step('Choose with the keyboard', async () => {
      await userEvent.click(metric);
      metric.blur();
      await userEvent.tab();
      await expect(metric).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(us).toHaveFocus();
      await expect(us).toBeChecked();
      await userEvent.tab();
      await expect(metric).not.toHaveFocus();
      await expect(us).not.toHaveFocus();
    });
  }
} satisfies Story;

const otherSegment = 'label:not(:has(:checked))';

export const IsHover = { parameters: { pseudo: { hover: [otherSegment] } } } satisfies Story;
export const IsPressed = { parameters: { pseudo: { active: [otherSegment] } } } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: ['input:checked'] } } } satisfies Story;
