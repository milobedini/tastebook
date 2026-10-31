import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { Field } from '@/dino/field';
import { isFocus, isHover } from '@/dino/story-states';
import { TextArea } from '@/dino/text-area';

const meta = {
  title: 'Dino/TextArea',
  component: TextArea,
  args: { 'aria-label': 'Method step', placeholder: 'Like “Fry the onions until soft.”' }
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

const getStep = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole<HTMLTextAreaElement>('textbox', { name: 'Method step' });

export const Default = {
  play: async ({ canvasElement }) => {
    const step = getStep(canvasElement);
    await expect(step).toBeInstanceOf(HTMLTextAreaElement);
    await expect(step).toHaveAttribute('placeholder', 'Like “Fry the onions until soft.”');
    await expect(step).toHaveValue('');
  }
} satisfies Story;
export const IsHover = { parameters: isHover } satisfies Story;
export const IsFocus = { args: { defaultValue: 'Fry the onions' }, parameters: isFocus } satisfies Story;
export const IsInvalid = {
  args: { 'aria-invalid': true },
  play: async ({ canvasElement }) => {
    await expect(getStep(canvasElement)).toHaveAttribute('aria-invalid', 'true');
  }
} satisfies Story;
export const IsDisabled = {
  args: { 'aria-disabled': true, defaultValue: 'Fry the onions until soft and golden.' },
  play: async ({ canvasElement }) => {
    const step = getStep(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard('x');
    await expect(step).toHaveFocus();
    await expect(step).toHaveValue('Fry the onions until soft and golden.');
    // Tab selected the text, and the selection outlasts the screenshot's blur.
    step.setSelectionRange(0, 0);
  }
} satisfies Story;
export const GrowsWithText = {
  play: async ({ canvasElement }) => {
    const step = getStep(canvasElement);
    const emptyHeight = step.offsetHeight;
    await userEvent.click(step);
    await userEvent.keyboard(
      'Fry the onions.{Enter}Add the garlic.{Enter}Stir in the spices.{Enter}Add the tomatoes.{Enter}Simmer for 20 minutes.'
    );
    await expect(step.offsetHeight).toBeGreaterThan(emptyHeight);
    await expect(step.scrollHeight).toBe(step.clientHeight);
  }
} satisfies Story;
export const IsNarrow = {
  args: { defaultValue: 'https://www.bbcgoodfood.com/recipes/chana-masala-with-crispy-chickpeas-and-spinach' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    )
  ],
  play: async ({ canvasElement }) => {
    const step = getStep(canvasElement);
    await expect(step.scrollWidth).toBe(step.clientWidth);
    await expect(step.offsetWidth).toBeLessThanOrEqual(320);
  }
} satisfies Story;
export const InField = {
  render: () => (
    <Field label="Method" error="Add at least one step.">
      {(control) => <TextArea {...control} />}
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const method = within(canvasElement).getByRole('textbox', { name: 'Method' });
    await expect(method).toHaveAttribute('aria-invalid', 'true');
    await expect(method).toHaveAccessibleDescription('Add at least one step.');
  }
} satisfies Story;
