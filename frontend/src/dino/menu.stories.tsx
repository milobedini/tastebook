import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@/dino/button';
import { Menu } from '@/dino/menu';

const signOut = fn();

const meta = {
  title: 'Dino/Menu',
  component: Menu,
  args: {
    trigger: <Button variant="secondary">Options</Button>,
    heading: 'Milo Bedini',
    items: [
      { kind: 'link', label: 'Account', to: '/account' },
      { kind: 'action', label: 'Sign out', onSelect: signOut }
    ]
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex justify-end">
          <Story />
        </div>
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    // The menu is portalled to the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Options' })).toHaveAttribute('aria-expanded', 'false');
    await expect(body.queryByRole('menu')).toBeNull();
  }
} satisfies Story;

export const IsOpen = {
  play: async ({ canvasElement }) => {
    // The menu is portalled to the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole('button', { name: 'Options' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());
    await expect(menu).toHaveTextContent('Milo Bedini');
    await expect(body.getAllByRole('menuitem')).toHaveLength(2);
    const account = body.getByRole('menuitem', { name: 'Account' });
    await expect(account).toHaveFocus();
    await expect(account).toHaveAttribute('href', '/account');
    await userEvent.keyboard('{ArrowDown}');
    await expect(body.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
    await expect(trigger).toHaveFocus();
    // Open again, so the shot shows the open menu.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
  }
} satisfies Story;

export const IsActionChosen = {
  play: async ({ canvasElement }) => {
    // The menu is portalled to the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    within(canvasElement).getByRole('button', { name: 'Options' }).focus();
    await userEvent.keyboard('{Enter}');
    await body.findByRole('menu');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(signOut).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull());
  }
} satisfies Story;
