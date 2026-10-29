import type { Meta, StoryObj } from '@storybook/react-vite';

import { Wordmark } from '@/dino/wordmark';

const meta = {
  title: 'Dino/Wordmark',
  component: Wordmark
} satisfies Meta<typeof Wordmark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const InAHeading = {
  render: () => (
    <h1>
      <Wordmark />
    </h1>
  )
} satisfies Story;
