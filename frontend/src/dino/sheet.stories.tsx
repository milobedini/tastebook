import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@/dino/button';
import { CheckboxRow } from '@/dino/checkbox-row';
import { Note } from '@/dino/note';
import { Sheet } from '@/dino/sheet';

const TickedRow = ({ name, amount }: { name: string; amount: string }) => {
  const [checked, setChecked] = useState(true);
  return (
    <CheckboxRow amount={amount} checked={checked} onCheckedChange={setChecked}>
      {name}
    </CheckboxRow>
  );
};

const meta = {
  title: 'Dino/Sheet',
  component: Sheet,
  args: {
    trigger: <Button variant="secondary">Add to the list</Button>,
    title: 'Add to the list',
    description: 'Chana masala',
    // Built in the render, since "Add 3 things" closes the sheet through its state.
    children: null
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <Sheet {...args} open={open} onOpenChange={setOpen}>
        <Note action={{ label: 'Add them', onClick: () => undefined }}>
          Left out salt, water and vegetable oil: you probably have them.
        </Note>
        <div className="flex flex-col">
          <TickedRow name="Garlic" amount="2 cloves" />
          <TickedRow name="Spinach" amount="275 g" />
          <TickedRow name="Bean sprouts" amount="225 g" />
        </div>
        <Button size="large" onClick={() => setOpen(false)}>
          Add 3 things
        </Button>
      </Sheet>
    );
  }
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
export const Open = {
  play: async ({ canvasElement, step }) => {
    // The sheet is portalled to the body, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole('button', { name: 'Add to the list' });
    const openSheet = async () => {
      await userEvent.click(trigger);
      const sheet = body.getByRole('dialog', { name: 'Add to the list' });
      // It slides up, so it's visible once the animation has started.
      await waitFor(() => expect(sheet).toBeVisible());
      return sheet;
    };
    const expectClosed = () => waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    await step('Open it', async () => {
      const sheet = await openSheet();
      await expect(sheet).toHaveAccessibleDescription('Chana masala');
      await expect(within(sheet).getByRole('button', { name: 'Close' })).toHaveFocus();
      await expect(sheet).toHaveStyle({
        borderTopLeftRadius: '32px',
        borderBottomLeftRadius: '0px',
        backgroundColor: 'rgb(42, 29, 71)'
      });
      await expect(within(sheet).getByRole('heading', { name: 'Add to the list' })).toHaveStyle({ fontSize: '34px' });
    });

    await step('Close each way', async () => {
      await userEvent.keyboard('{Escape}');
      await expectClosed();
      await expect(trigger).toHaveFocus();

      await userEvent.click(within(await openSheet()).getByRole('button', { name: 'Close' }));
      await expectClosed();

      await openSheet();
      const scrim = canvasElement.ownerDocument.querySelector('[data-slot="sheet-scrim"]');
      if (!(scrim instanceof HTMLElement)) throw new Error('The scrim is missing');
      // Its top-left corner, outside the sheet.
      await userEvent.pointer({ keys: '[MouseLeft]', target: scrim, coords: { clientX: 4, clientY: 4 } });
      await expectClosed();

      await userEvent.click(within(await openSheet()).getByRole('button', { name: 'Add 3 things' }));
      await expectClosed();
    });

    await step('Ends open', async () => {
      await openSheet();
    });
  }
} satisfies Story;
