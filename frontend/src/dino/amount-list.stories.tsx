import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { AmountList } from '@/dino/amount-list';

const meta = {
  title: 'Dino/AmountList',
  component: AmountList,
  args: {
    items: [
      { key: 1, name: 'Dried chickpeas', amount: '250 g' },
      { key: 2, name: 'Water', amount: '500 ml' },
      { key: 3, name: 'Salt', amount: '' }
    ]
  }
} satisfies Meta<typeof AmountList>;

export default meta;

type Story = StoryObj<typeof meta>;

const itemTexts = (canvasElement: HTMLElement) =>
  within(canvasElement)
    .getAllByRole('listitem')
    .map((item) => item.textContent?.replace(/\s+/g, ' ').trim());

export const Default = {
  play: async ({ canvasElement }) => {
    await expect(itemTexts(canvasElement)).toEqual(['Dried chickpeas 250 g', 'Water 500 ml', 'Salt']);
    // A line with no amount has no leader to join it to.
    await expect(canvasElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  }
} satisfies Story;

export const LongName = {
  args: {
    items: [
      { key: 1, name: 'Ripe plum tomatoes, peeled, deseeded and very finely chopped', amount: '1.5 kg' },
      { key: 2, name: 'Water', amount: '500 ml' }
    ]
  },
  play: async ({ canvasElement }) => {
    // The name wraps rather than pushing its amount out of the list.
    const list = within(canvasElement).getByRole('list');
    const amount = within(canvasElement).getByText('1.5 kg');
    await expect(amount.getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right);
  }
} satisfies Story;
