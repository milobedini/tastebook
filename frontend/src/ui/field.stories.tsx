import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Field } from '@/ui/field';
import { Input } from '@/ui/input';

const meta = {
  title: 'Dino/Field',
  component: Field,
  args: { label: 'Recipe title', children: (control) => <Input {...control} /> }
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithHelp = {
  args: {
    label: 'Recipe title',
    help: 'Shown on cards and at the top of the recipe.',
    children: (control) => <Input {...control} defaultValue="Courgette and lemon orzo" />
  },
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByRole('textbox', { name: 'Recipe title' });
    await expect(title).toHaveAccessibleDescription('Shown on cards and at the top of the recipe.');
    await expect(title).not.toHaveAttribute('aria-invalid');
  }
} satisfies Story;
export const WithError = {
  args: {
    label: 'Servings',
    error: 'Enter a number, like 4.',
    children: (control) => <Input {...control} defaultValue="four" />
  },
  play: async ({ canvasElement }) => {
    const servings = within(canvasElement).getByRole('textbox', { name: 'Servings' });
    await expect(servings).toHaveAttribute('aria-invalid', 'true');
    await expect(servings).toHaveAccessibleDescription('Enter a number, like 4.');
  }
} satisfies Story;
