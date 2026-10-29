import type { Preview } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '../src/dino/enamel.css';

// Same tags and extra rule as e2e/fixtures.ts, so a story and a page are held to one bar.
const wcag22aaTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const preview: Preview = {
  // Stories show Enamel's dark theme only; the app keeps both until TAS-73.
  beforeAll: () => {
    document.documentElement.dataset.theme = 'dark';
  },
  parameters: {
    a11y: {
      test: 'error',
      // body, not the story root, so portalled dialogs and toasts are checked too.
      context: 'body',
      options: {
        runOnly: { type: 'tag', values: wcag22aaTags },
        rules: { 'aria-dialog-name': { enabled: true } }
      }
    }
  },
  afterEach: ({ canvasElement }) => {
    const shortControls = [
      ...canvasElement.ownerDocument.body.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, [role="checkbox"]'
      )
    ]
      .filter((control) => control.checkVisibility())
      .map((control) => {
        // A checkbox's target is its whole row, the label around it.
        const target = control.getAttribute('role') === 'checkbox' ? (control.closest('label') ?? control) : control;
        return {
          name: control.getAttribute('aria-label') ?? control.textContent ?? control.outerHTML,
          height: target.getBoundingClientRect().height
        };
      })
      .filter((control) => control.height < 44);

    expect(shortControls).toEqual([]);
  }
};

export default preview;
