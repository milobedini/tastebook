import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bookmark, CalendarPlus } from 'lucide-react';
import { fn } from 'storybook/test';

import { Button } from '@/ui/button';
import { isFocus, isHover, isPressed } from '@/ui/story-states';

const meta = {
  title: 'Dino/Button',
  component: Button,
  args: { onClick: fn() }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Bookmark aria-hidden="true" />
        Save recipe
      </>
    )
  }
} satisfies Story;
export const PrimaryIsHover = { ...Primary, parameters: isHover } satisfies Story;
export const PrimaryIsPressed = { ...Primary, parameters: isPressed } satisfies Story;
export const PrimaryIsFocus = { ...Primary, parameters: isFocus } satisfies Story;
export const PrimaryIsDisabled = { args: { ...Primary.args, disabled: true } } satisfies Story;

export const Secondary = {
  args: {
    variant: 'secondary',
    children: (
      <>
        <CalendarPlus aria-hidden="true" />
        Add to plan
      </>
    )
  }
} satisfies Story;
export const SecondaryIsHover = { ...Secondary, parameters: isHover } satisfies Story;
export const SecondaryIsPressed = { ...Secondary, parameters: isPressed } satisfies Story;
export const SecondaryIsFocus = { ...Secondary, parameters: isFocus } satisfies Story;
export const SecondaryIsDisabled = { args: { ...Secondary.args, disabled: true } } satisfies Story;

export const Ghost = { args: { variant: 'ghost', children: 'Cancel' } } satisfies Story;
export const GhostIsHover = { ...Ghost, parameters: isHover } satisfies Story;
export const GhostIsPressed = { ...Ghost, parameters: isPressed } satisfies Story;
export const GhostIsFocus = { ...Ghost, parameters: isFocus } satisfies Story;
export const GhostIsDisabled = { args: { ...Ghost.args, disabled: true } } satisfies Story;

export const Danger = { args: { variant: 'danger', children: 'Delete account' } } satisfies Story;
export const DangerIsHover = { ...Danger, parameters: isHover } satisfies Story;
export const DangerIsPressed = { ...Danger, parameters: isPressed } satisfies Story;
export const DangerIsFocus = { ...Danger, parameters: isFocus } satisfies Story;
export const DangerIsDisabled = { args: { ...Danger.args, disabled: true } } satisfies Story;
