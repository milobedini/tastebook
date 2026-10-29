import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { Polaroid } from '@/dino/polaroid';
import { RecipePhoto } from '@/dino/recipe-photo';

const photoUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23e2583e'/%3E%3C/svg%3E";

type HeroPolaroidProps = ComponentProps<typeof RecipePhoto> & { tape?: boolean };

const HeroPolaroid = ({ tape, ...props }: HeroPolaroidProps) => (
  <Polaroid frame="large" lean="left" tape={tape}>
    <RecipePhoto {...props} />
  </Polaroid>
);

const meta = {
  title: 'Dino/Polaroid',
  component: HeroPolaroid,
  args: {
    shape: 'hero',
    recipeId: 3,
    alt: 'Bibimbap',
    photo: { thumbnails: [{ width: 640, url: photoUrl }] },
    caption: 'Photo by A. Cook, CC BY-SA 4.0'
  }
} satisfies Meta<typeof HeroPolaroid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero = {} satisfies Story;
export const HeroWithoutPhoto = { args: { photo: null, recipeId: 2, caption: undefined } } satisfies Story;
export const LargeText = {} satisfies Story;
export const LargeTaped = { args: { tape: true } } satisfies Story;
