import type { Meta, StoryObj } from '@storybook/react-vite';

import { Polaroid } from '@/dino/polaroid';
import { RecipePhoto } from '@/dino/recipe-photo';
import { Sticker, StickeredPhoto, type StickerItem } from '@/dino/sticker';

const photoUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23e2583e'/%3E%3C/svg%3E";

const meta = {
  title: 'Dino/Sticker',
  component: Sticker,
  args: { label: 'Vegan', kind: 'diet', lean: 'left' }
} satisfies Meta<typeof Sticker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Diet = {} satisfies Story;
export const DietLeansRight = { args: { label: 'Gluten-free', lean: 'right' } } satisfies Story;
export const Time = { args: { label: '25 min', kind: 'time', lean: 'right' } } satisfies Story;

const StickeredPolaroid = ({ stickers }: { stickers: StickerItem[] }) => (
  <StickeredPhoto stickers={stickers}>
    <Polaroid frame="large" lean="left">
      <RecipePhoto
        shape="hero"
        recipeId={3}
        alt="Bibimbap"
        photo={{ thumbnails: [{ width: 640, url: photoUrl }] }}
        caption="Photo by A. Cook, CC BY-SA 4.0"
      />
    </Polaroid>
  </StickeredPhoto>
);

const onAPolaroid: StickerItem[] = [
  { label: 'Vegan', kind: 'diet' },
  { label: 'Gluten-free', kind: 'diet' }
];

export const OnAPolaroid = { render: () => <StickeredPolaroid stickers={onAPolaroid} /> } satisfies Story;

export const ThreeStickers = {
  render: () => (
    <StickeredPolaroid
      stickers={[
        { label: 'Vegetarian', kind: 'diet' },
        { label: 'Gluten-free', kind: 'diet' },
        { label: 'Dairy-free', kind: 'diet' }
      ]}
    />
  )
} satisfies Story;

export const LargeText = { render: OnAPolaroid.render } satisfies Story;
