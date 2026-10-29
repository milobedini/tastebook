import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { expect, within } from 'storybook/test';

import { PolaroidCard } from '@/dino/polaroid-card';
import { isHover, isPressed } from '@/dino/story-states';

const photoUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23e2583e'/%3E%3C/svg%3E";

const meta = {
  title: 'Dino/PolaroidCard',
  component: PolaroidCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        {/* A list polaroid's width on a phone, two a row; full width at large text. */}
        <div className="w-45 large-text:w-full">
          <Story />
        </div>
      </MemoryRouter>
    )
  ],
  args: {
    title: 'Bibimbap',
    to: '/recipes/bibimbap',
    recipeId: 3,
    photo: { thumbnails: [{ width: 640, url: photoUrl }] },
    lean: 'left',
    children: <p className="tabular-nums">35 min · Easy · Korean</p>
  }
} satisfies Meta<typeof PolaroidCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Bibimbap' });
    await expect(link).toHaveAttribute('href', '/recipes/bibimbap');
    await expect(link).toHaveAccessibleDescription('35 min · Easy · Korean');
  }
} satisfies Story;
export const LeansRight = { args: { lean: 'right' } } satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: ['a'] } } } satisfies Story;
export const PlaceSetting = { args: { photo: null, recipeId: 2, title: 'Shakshuka' } } satisfies Story;
export const Rug = { args: { photo: null, recipeId: 1, title: 'Ribollita' } } satisfies Story;
export const LongTitle = {
  args: { title: 'Slow-roasted pork shoulder with crackling, apple sauce and Yorkshire puddings' }
} satisfies Story;
export const LargeText = {} satisfies Story;
