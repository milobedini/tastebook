import type { Meta, StoryObj } from '@storybook/react-vite';

import { Banner } from '@/ui/banner';

const meta = {
  title: 'Dino/Banner',
  component: Banner
} satisfies Meta<typeof Banner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success = {
  args: {
    tone: 'success',
    title: 'Imported without gaps',
    children: "From bbcgoodfood.com. It's private to your household."
  }
} satisfies Story;
export const Warning = {
  args: {
    tone: 'warning',
    title: '2 gaps in this import',
    children: 'Check the amounts marked in yolk before you cook it.'
  }
} satisfies Story;
export const Danger = {
  args: { tone: 'danger', title: "Couldn't import that page", children: 'Check the web address, then try again.' }
} satisfies Story;
