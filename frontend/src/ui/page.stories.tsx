import type { Meta, StoryObj } from '@storybook/react-vite';

import { Page } from '@/ui/page';

const meta = {
  title: 'Dino/Page',
  component: Page,
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    children: (
      <>
        <h1>Recipes</h1>
        <p>Every recipe in the catalogue and your household's own.</p>
      </>
    )
  }
} satisfies Story;
