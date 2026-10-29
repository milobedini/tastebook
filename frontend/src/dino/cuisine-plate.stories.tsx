import type { Meta, StoryObj } from '@storybook/react-vite';

import { CuisinePlate } from '@/dino/cuisine-plate';

const meta = {
  title: 'Dino/CuisinePlate',
  component: CuisinePlate,
  args: { shape: 'card', cuisineSlug: 'italian' }
} satisfies Meta<typeof CuisinePlate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Italian = {} satisfies Story;
export const Indian = { args: { cuisineSlug: 'indian' } } satisfies Story;
export const Japanese = { args: { cuisineSlug: 'japanese' } } satisfies Story;
export const Mexican = { args: { cuisineSlug: 'mexican' } } satisfies Story;
export const French = { args: { cuisineSlug: 'french' } } satisfies Story;
export const EverythingElse = { args: { cuisineSlug: undefined } } satisfies Story;
export const Hero = { args: { cuisineSlug: 'japanese', shape: 'hero' } } satisfies Story;
