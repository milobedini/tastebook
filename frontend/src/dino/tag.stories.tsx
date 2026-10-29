import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tag } from '@/dino/tag';

const meta = {
  title: 'Dino/Tag',
  component: Tag,
  args: { children: 'Vegetarian' }
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
