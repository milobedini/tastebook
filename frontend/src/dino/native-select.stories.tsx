import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';

import { Field } from '@/dino/field';
import { NativeSelect } from '@/dino/native-select';

const meta = {
  title: 'Dino/NativeSelect',
  component: NativeSelect,
  args: {
    defaultValue: 'indian',
    children: (
      <>
        <option value="indian">Indian</option>
        <option value="italian">Italian</option>
        <option value="korean">Korean</option>
      </>
    )
  },
  render: (args) => <Field label="Cuisine">{(control) => <NativeSelect {...args} {...control} />}</Field>
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const IsHover = { parameters: { pseudo: { hover: ['select'] } } } satisfies Story;
export const IsFocus = { parameters: { pseudo: { focusVisible: ['select'] } } } satisfies Story;
export const IsDisabled = {
  args: { 'aria-disabled': true },
  play: async ({ canvasElement }) => {
    const cuisine = within(canvasElement).getByRole('combobox', { name: 'Cuisine' });
    await userEvent.tab();
    await expect(cuisine).toHaveFocus();
    await expect(fireEvent.mouseDown(cuisine)).toBe(false);
    await expect(fireEvent.keyDown(cuisine, { key: 'ArrowDown' })).toBe(false);
    await expect(fireEvent.keyDown(cuisine, { key: 'Tab' })).toBe(true);
  }
} satisfies Story;
