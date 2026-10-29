import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Page } from '@/dino/page';

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
        <h1>What shall we cook tonight?</h1>
        <p>Every recipe in the catalogue and your household's own.</p>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    // 20 px gutters on a phone, as in the visual run, and 32 px from 640 px, as under Vitest.
    const gutter = window.matchMedia('(min-width: 40rem)').matches ? '32px' : '20px';
    const main = within(canvasElement).getByRole('main');
    await expect(getComputedStyle(main).paddingLeft).toBe(gutter);
    await expect(getComputedStyle(main).paddingRight).toBe(gutter);
  }
} satisfies Story;
