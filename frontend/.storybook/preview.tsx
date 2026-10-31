import type { Preview } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '../src/dino/picnic.css';

// Same tags and extra rule as e2e/fixtures.ts, so a story and a page are held to one bar.
const wcag22aaTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const preview: Preview = {
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
        'button, a[href], input, textarea, select, [role="checkbox"], [role="switch"], [role="menuitem"]'
      )
    ]
      .filter((control) => control.checkVisibility())
      .map((control) => {
        // A checkbox's or switch's target is its whole row, the label around it.
        const target = ['checkbox', 'switch'].includes(control.getAttribute('role') ?? '')
          ? (control.closest('label') ?? control)
          : control;
        return {
          name: control.getAttribute('aria-label') ?? control.textContent ?? control.outerHTML,
          // The layout height, so a pressed control's shrink doesn't count.
          height: target.offsetHeight
        };
      })
      .filter((control) => control.height < 44);

    expect(shortControls).toEqual([]);
  }
};

export default preview;
