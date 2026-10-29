import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { expect, within } from 'storybook/test';

import { RecipeCard } from '@/ui/recipe-card';
import { isHover, isPressed } from '@/ui/story-states';

const photoUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23e2583e'/%3E%3C/svg%3E";

const meta = {
  title: 'Dino/RecipeCard',
  component: RecipeCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ],
  args: {
    title: 'Courgette and lemon orzo',
    to: '/recipes/courgette-and-lemon-orzo',
    cuisineSlug: 'italian',
    children: (
      <p className="flex flex-wrap gap-x-2.5 tabular-nums">
        <span>35 min</span>
        <span>Easy</span>
        <span>Italian</span>
      </p>
    )
  }
} satisfies Meta<typeof RecipeCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Courgette and lemon orzo' })).toHaveAttribute(
      'href',
      '/recipes/courgette-and-lemon-orzo'
    );
  }
} satisfies Story;
export const WithPhoto = { args: { photo: { thumbnails: [{ width: 640, url: photoUrl }] } } } satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsPressed = { parameters: isPressed } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: ['a'] } } } satisfies Story;
