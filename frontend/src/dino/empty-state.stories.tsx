import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Button } from '@/dino/button';
import { EmptyState } from '@/dino/empty-state';

const meta = {
  title: 'Dino/EmptyState',
  component: EmptyState,
  args: {
    title: 'No recipes match',
    children: 'Nothing is vegetarian, one-pot and under 30 minutes yet. Try removing a filter.'
  }
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

const clearFilters = <Button variant="secondary">Clear filters</Button>;

export const Default = {
  args: { action: clearFilters, doodle: 'one fewer?' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'No recipes match' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    const note = canvas.getByText('one fewer?');
    await expect(note).toBeVisible();
    await expect(note.closest('[aria-hidden="true"]')).not.toBeNull();
  }
} satisfies Story;

export const WithoutDoodle = {
  args: { action: clearFilters },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    await expect(canvas.queryByText('one fewer?')).toBeNull();
  }
} satisfies Story;

export const WithoutAction = {} satisfies Story;
