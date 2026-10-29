import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '@/ui/input';
import { isFocus, isHover } from '@/ui/story-states';

const meta = {
  title: 'Dino/Input',
  component: Input,
  args: { 'aria-label': 'Recipe title', defaultValue: 'Courgette and lemon orzo' }
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsFocus = { parameters: isFocus } satisfies Story;
export const IsDisabled = { args: { disabled: true } } satisfies Story;
export const IsInvalid = { args: { 'aria-invalid': true } } satisfies Story;
