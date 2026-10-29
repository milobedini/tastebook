import type { Meta, StoryObj } from '@storybook/react-vite';

import { NativeSelect } from '@/ui/native-select';
import { isFocus, isHover } from '@/ui/story-states';

const meta = {
  title: 'Dino/NativeSelect',
  component: NativeSelect,
  args: {
    'aria-label': 'Cuisine',
    defaultValue: '',
    children: (
      <>
        <option value="">All cuisines</option>
        <option value="italian">Italian</option>
        <option value="indian">Indian</option>
        <option value="japanese">Japanese</option>
      </>
    )
  }
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
export const IsDisabled = { args: { disabled: true } } satisfies Story;
