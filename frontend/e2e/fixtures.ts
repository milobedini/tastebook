import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

// axe has no wcag22a tag: WCAG 2.2's new A criteria are all covered by the earlier levels' rules.
const wcag22aaTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Best-practice rules the tags leave out but WCAG 4.1.2 still asks for: a dialog needs a name.
const extraRules = { 'aria-dialog-name': { enabled: true } };

type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

const describeViolation = ({ id, impact, help, nodes }: Violation): string =>
  `${id} (${impact ?? 'unknown impact'}): ${help}, at ${nodes.map(({ target }) => target.join(' ')).join('; ')}`;

type Accessibility = {
  // Scans the page as it is now; call it on each page a spec visits before moving on.
  check: () => Promise<void>;
};

export const test = base.extend<{ accessibility: Accessibility }>({
  accessibility: [
    async ({ page }, use, testInfo) => {
      const check = async (): Promise<void> => {
        const { violations } = await new AxeBuilder({ page })
          .options({ rules: extraRules })
          .withTags(wcag22aaTags)
          .analyze();
        expect(violations.map(describeViolation), `WCAG 2.2 A or AA violations on ${page.url()}`).toEqual([]);
      };

      await use({ check });

      // The page a test ends on is scanned for every test, so no spec can skip axe.
      if (testInfo.status === testInfo.expectedStatus) {
        await check();
      }
    },
    { auto: true }
  ]
});

export { expect };
