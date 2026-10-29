import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bookmark, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@/dino/button';
import { isFocus, isHover, isPressed } from '@/dino/story-states';

const meta = {
  title: 'Dino/Button',
  component: Button,
  args: { onClick: fn() }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

const disabledReason = 'Tick at least one thing to add.';

const playIsLoading =
  (name: string): Story['play'] =>
  async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name });
    await expect(button).toHaveAttribute('aria-busy', 'true');
  };

export const Primary = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Bookmark aria-hidden="true" />
        Save recipe
      </>
    )
  },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save recipe' });
    await expect(button).toHaveStyle({ backgroundColor: 'rgb(255, 179, 138)', color: 'rgb(42, 20, 64)' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  }
} satisfies Story;
export const PrimaryIsHover = { ...Primary, parameters: isHover } satisfies Story;
export const PrimaryIsPressed = { ...Primary, parameters: isPressed } satisfies Story;
export const PrimaryIsFocus = { ...Primary, parameters: isFocus } satisfies Story;
export const PrimaryIsDisabled = {
  args: { ...Primary.args, disabled: true, disabledReason },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save recipe' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAccessibleDescription(disabledReason);
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  }
} satisfies Story;
export const PrimaryIsLoading = {
  args: Primary.args,
  render: ({ onClick }) => {
    const [loading, setLoading] = useState(false);
    return (
      <Button
        variant="primary"
        loading={loading}
        loadingLabel="Saving…"
        onClick={(event) => {
          onClick?.(event);
          setLoading(true);
        }}
      >
        {Primary.args.children}
      </Button>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const idle = canvas.getByRole('button', { name: 'Save recipe' });
    const width = idle.offsetWidth;
    await userEvent.click(idle);
    const saving = canvas.getByRole('button', { name: 'Saving…' });
    await expect(saving).toHaveAttribute('aria-busy', 'true');
    await expect(saving.offsetWidth).toBe(width);
    await userEvent.click(saving);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  }
} satisfies Story;

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
export const SecondaryIsDisabled = { args: { ...Secondary.args, disabled: true, disabledReason } } satisfies Story;
export const SecondaryIsLoading = {
  args: { ...Secondary.args, loading: true, loadingLabel: 'Adding…' },
  play: playIsLoading('Adding…')
} satisfies Story;

export const Ghost = { args: { variant: 'ghost', children: 'Cancel' } } satisfies Story;
export const GhostIsHover = { ...Ghost, parameters: isHover } satisfies Story;
export const GhostIsPressed = { ...Ghost, parameters: isPressed } satisfies Story;
export const GhostIsFocus = { ...Ghost, parameters: isFocus } satisfies Story;
export const GhostIsDisabled = { args: { ...Ghost.args, disabled: true, disabledReason } } satisfies Story;

export const Danger = { args: { variant: 'danger', children: 'Delete account' } } satisfies Story;
export const DangerIsHover = { ...Danger, parameters: isHover } satisfies Story;
export const DangerIsPressed = { ...Danger, parameters: isPressed } satisfies Story;
export const DangerIsFocus = { ...Danger, parameters: isFocus } satisfies Story;
export const DangerIsDisabled = { args: { ...Danger.args, disabled: true, disabledReason } } satisfies Story;
export const DangerIsLoading = {
  args: { ...Danger.args, loading: true, loadingLabel: 'Deleting…' },
  play: playIsLoading('Deleting…')
} satisfies Story;

export const Large = {
  args: { variant: 'primary', size: 'large', children: 'Next step' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Next step' });
    await expect(button.offsetHeight).toBe(64);
  }
} satisfies Story;
export const LargeIsDisabled = {
  args: { variant: 'primary', size: 'large', children: 'Add 0 things', disabled: true, disabledReason },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Add 0 things' })).toHaveAccessibleDescription(disabledReason);
    await expect(canvas.getByText(disabledReason)).toBeVisible();
  }
} satisfies Story;
