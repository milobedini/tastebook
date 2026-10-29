import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Squiggle } from '@/dino/squiggle';
import { Wordmark } from '@/dino/wordmark';

const meta = {
  title: 'Dino/Squiggle',
  component: Squiggle,
  args: { children: <Wordmark /> },
  render: (args) => (
    <h1>
      <Squiggle {...args} />
    </h1>
  )
} satisfies Meta<typeof Squiggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Tastebook' })).toBeVisible();
    // The wave is decoration: it stays out of the heading's name and the accessibility tree.
    await expect(canvasElement.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  }
} satisfies Story;

export const Emphasis = {
  args: { children: 'cook', emphasis: true },
  render: (args) => (
    <h1>
      What shall we <Squiggle {...args} /> tonight?
    </h1>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'What shall we cook tonight?' })).toBeVisible();
    await expect(getComputedStyle(canvas.getByText('cook')).fontStyle).toBe('italic');
  }
} satisfies Story;
