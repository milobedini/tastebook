import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';

import { TopBar } from '@/dino/top-bar';

const meta = {
  title: 'Dino/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
  args: { searchLabel: 'Search recipes', searchValue: '', onSearchValueChange: () => {} },
  // The value lives in React state: under Vitest, useArgs updates never re-render.
  render: (args) => {
    const [searchValue, setSearchValue] = useState(args.searchValue);
    return <TopBar {...args} searchValue={searchValue} onSearchValueChange={setSearchValue} />;
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Tastebook' })).toHaveAttribute('aria-current', 'page');
  }
} satisfies Story;

// The visual run is a phone, where the icon button opens the field under the bar; on a laptop, as under Vitest, the
// field is always in the bar and the button is hidden.
export const IsSearchOpen = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchBox = () => canvas.getByRole('searchbox', { name: 'Search recipes' });
    if (window.matchMedia('(min-width: 64rem)').matches) {
      await expect(searchBox()).toBeVisible();
      await expect(canvas.queryByRole('button', { name: 'Search recipes' })).toBeNull();
      return;
    }
    const button = canvas.getByRole('button', { name: 'Search recipes' });
    await expect(canvas.queryByRole('searchbox', { name: 'Search recipes' })).toBeNull();
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(searchBox()).toBeVisible();
    await expect(searchBox()).toHaveFocus();
  }
} satisfies Story;
