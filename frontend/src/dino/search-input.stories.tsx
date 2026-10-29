import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchInput } from '@/dino/input';
import { isFocus, isHover } from '@/dino/story-states';

const meta = {
  title: 'Dino/SearchInput',
  component: SearchInput,
  args: { 'aria-label': 'Search', placeholder: 'Recipes, ingredients, cuisines' }
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
