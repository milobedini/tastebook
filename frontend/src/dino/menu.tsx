import { DropdownMenu } from 'radix-ui';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

export type MenuItem =
  | { kind: 'link'; label: string; to: string }
  | { kind: 'action'; label: string; onSelect: () => void };

type MenuProps = {
  // A button; Radix adds aria-haspopup and aria-expanded.
  trigger: ReactElement;
  heading?: string;
  items: MenuItem[];
};

// Radix highlights an item by focusing it, so the ring keys on focus-visible: a keyboard user sees it, a pointer
// doesn't. Forced colours drops the Line fill, so there the highlighted item takes the ring too.
const itemClassName =
  'flex min-h-11 cursor-pointer items-center rounded-option px-3.5 py-2.5 text-body text-ink no-underline data-highlighted:bg-line focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ink data-highlighted:active:bg-surface-pressed forced-colors:data-highlighted:outline-3 forced-colors:data-highlighted:-outline-offset-3 forced-colors:data-highlighted:outline-[Highlight]';

const MenuLinkItem = ({ item }: { item: Extract<MenuItem, { kind: 'link' }> }) => (
  <DropdownMenu.Item asChild className={itemClassName}>
    <Link to={item.to}>{item.label}</Link>
  </DropdownMenu.Item>
);

const MenuActionItem = ({ item }: { item: Extract<MenuItem, { kind: 'action' }> }) => (
  <DropdownMenu.Item className={itemClassName} onSelect={item.onSelect}>
    {item.label}
  </DropdownMenu.Item>
);

// Not modal: a modal menu hides the page from screen readers with aria-hidden while its trigger stays focusable, which
// axe fails (aria-hidden-focus). Escape, Tab and a click outside still close it.
export const Menu = ({ trigger, heading, items }: MenuProps) => (
  <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={8}
        collisionPadding={20}
        className="z-50 flex w-max min-w-56 max-w-[min(--spacing(80),var(--radix-dropdown-menu-content-available-width))] flex-col gap-0.5 rounded-card border-2 border-field bg-surface p-1.5 text-ink duration-150 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        {heading !== undefined && (
          <>
            <DropdownMenu.Label className="px-3.5 pt-2.5 pb-2 text-label [overflow-wrap:anywhere]">
              {heading}
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="mx-2 mt-0.5 mb-1 border-line border-t" />
          </>
        )}
        {items.map((item) =>
          item.kind === 'link' ? (
            <MenuLinkItem key={item.label} item={item} />
          ) : (
            <MenuActionItem key={item.label} item={item} />
          )
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);
