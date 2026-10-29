import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Input } from '@/dino/input';
import { isFocus, isHover } from '@/dino/story-states';

const meta = {
  title: 'Dino/Input',
  component: Input,
  args: { 'aria-label': 'Recipe name', placeholder: 'Like “Nonna’s lasagne”' }
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsFocus = { args: { defaultValue: 'Chana mas' }, parameters: isFocus } satisfies Story;
export const IsInvalid = { args: { 'aria-invalid': true } } satisfies Story;
export const IsDisabled = {
  args: { type: 'url', 'aria-disabled': true, defaultValue: 'bbcgoodfood.com/recipes/chana-masala' },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole<HTMLInputElement>('textbox', { name: 'Recipe name' });
    await userEvent.tab();
    await userEvent.keyboard('x');
    await expect(link).toHaveFocus();
    await expect(link).toHaveValue('bbcgoodfood.com/recipes/chana-masala');
    // Tab selected the text, and the selection outlasts the screenshot's blur.
    link.setSelectionRange(0, 0);
  }
} satisfies Story;
