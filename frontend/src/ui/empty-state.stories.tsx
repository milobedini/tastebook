import type { Meta, StoryObj } from '@storybook/react-vite';
import { CookingPot } from 'lucide-react';

import { Button } from '@/ui/button';
import { EmptyState } from '@/ui/empty-state';

const meta = {
  title: 'Dino/EmptyState',
  component: EmptyState,
  args: {
    icon: CookingPot,
    title: 'No recipes match',
    children: 'Nothing is vegetarian, one-pot and under 30 minutes yet. Try removing a filter.'
  }
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = { args: { action: <Button variant="secondary">Clear filters</Button> } } satisfies Story;
export const WithoutAction = {} satisfies Story;
