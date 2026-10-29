import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Field } from '@/dino/field';
import { SearchInput } from '@/dino/input';

const meta = {
  title: 'Dino/SearchInput',
  component: SearchInput,
  args: { value: '', onValueChange: fn(), placeholder: 'Search recipes' },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <Field label="Search recipes" hideLabel>
        {(control) => <SearchInput {...args} {...control} value={value} onValueChange={setValue} />}
      </Field>
    );
  }
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole('searchbox', { name: 'Search recipes' });
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    await userEvent.type(search, 'dahl');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));

    await expect(search).toHaveValue('');
    await expect(search).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  }
} satisfies Story;
export const IsHover = { parameters: { pseudo: { hover: ['input'] } } } satisfies Story;
export const IsFocus = {
  args: { value: 'dahl' },
  parameters: { pseudo: { focusVisible: ['input'], focusWithin: ['.group'] } }
} satisfies Story;
export const IsDisabled = {
  args: { value: 'dahl', 'aria-disabled': true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('searchbox', { name: 'Search recipes' })).toHaveValue('dahl');
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  }
} satisfies Story;
