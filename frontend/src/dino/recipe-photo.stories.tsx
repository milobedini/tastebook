import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { RecipePhoto } from '@/dino/recipe-photo';

const photoUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23e2583e'/%3E%3C/svg%3E";

const meta = {
  title: 'Dino/RecipePhoto',
  component: RecipePhoto,
  args: {
    shape: 'card',
    recipeId: 3,
    alt: 'Courgette and lemon orzo',
    photo: { thumbnails: [{ width: 640, url: photoUrl }] }
  }
} satisfies Meta<typeof RecipePhoto>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlaceSetting = { args: { photo: null, recipeId: 2 } } satisfies Story;
export const Rug = { args: { photo: null, recipeId: 1 } } satisfies Story;
export const Card = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('img')).toHaveAttribute('src', photoUrl);
  }
} satisfies Story;
export const Hero = { args: { shape: 'hero' } } satisfies Story;
export const BrokenPhoto = {
  args: { photo: { thumbnails: [{ width: 640, url: '/missing-photo.jpg' }] } },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('img')).toBeNull());
    await expect(canvasElement.querySelector('[data-filler="rug"]')).not.toBeNull();
  }
} satisfies Story;
