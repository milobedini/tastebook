import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Method } from '@/dino/method';

const meta = {
  title: 'Dino/Method',
  component: Method,
  args: {
    steps: [
      {
        key: 1,
        text: 'Put the chickpeas in a large bowl, cover with plenty of cold water and leave to soak overnight.'
      },
      {
        key: 2,
        text:
          'The next day, drain the chickpeas and put them in a large pan with the 500 ml of fresh water and salt to ' +
          'taste. Bring to the boil, then simmer for 60 to 90 minutes until tender.'
      },
      {
        key: 3,
        text:
          'Heat the oil in a heavy-based pan. Add the coriander, cumin and nigella seeds and cook briefly until they ' +
          'crackle. Quickly add the onion and garlic, lower the heat to medium and fry until the onion is translucent.'
      },
      {
        key: 4,
        text:
          'Add the tomatoes and ginger and cook for 10 minutes until thick. Stir in the drained chickpeas and simmer ' +
          'for 15 minutes more.'
      }
    ]
  }
} satisfies Meta<typeof Method>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list');
    await expect(list.tagName).toBe('OL');
    await expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    await expect(getComputedStyle(within(list).getByText('1')).fontStyle).toBe('italic');
  }
} satisfies Story;
