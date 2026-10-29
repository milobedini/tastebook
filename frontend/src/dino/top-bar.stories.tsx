import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import type { MenuItem } from '@/dino/menu';
import { TopBar } from '@/dino/top-bar';

const menuItems: MenuItem[] = [
  { kind: 'link', label: 'Account', to: '/account' },
  { kind: 'action', label: 'Sign out', onSelect: fn() }
];

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

export const SignedIn = {
  args: { account: { status: 'signed-in', name: 'Milo Bedini', menuItems } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const avatar = canvas.getByRole('button', { name: 'Account for Milo Bedini' });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveTextContent(/^M$/);
    await expect(avatar).toHaveAttribute('aria-haspopup', 'menu');
    await expect(canvas.queryByRole('link', { name: 'Sign in' })).toBeNull();
  }
} satisfies Story;

export const SignedOut = {
  args: { account: { status: 'signed-out', signInTo: '/sign-in' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
    await expect(canvas.queryByRole('button', { name: /^Account/ })).toBeNull();
  }
} satisfies Story;

export const IsMenuOpen = {
  args: { account: { status: 'signed-in', name: 'Milo Bedini', menuItems } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The menu is portalled to the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    const avatar = canvas.getByRole('button', { name: 'Account for Milo Bedini' });
    // The wordmark, then the search (its button on a phone, its field on a laptop), then the avatar.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(avatar).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(await body.findByRole('menu')).toHaveTextContent('Milo Bedini');
    await expect(body.getByRole('menuitem', { name: 'Account' })).toHaveFocus();
    await expect(avatar).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{End}');
    await expect(body.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
    await expect(avatar).toHaveFocus();
    // Open again, so the shot shows the open menu.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
  }
} satisfies Story;

export const IsSignedInWithoutName = {
  args: { account: { status: 'signed-in', name: '', menuItems } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const avatar = within(canvasElement).getByRole('button', { name: 'Account' });
    await expect(avatar).toBeVisible();
    await userEvent.click(avatar);
    await expect(body.getAllByRole('menuitem')).toHaveLength(2);
    await expect((await body.findByRole('menu')).textContent).toBe('AccountSign out');
  }
} satisfies Story;
