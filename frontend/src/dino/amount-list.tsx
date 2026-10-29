import type { ReactNode } from 'react';

type AmountItem = { key: string | number; name: ReactNode; amount: string };

type AmountListProps = { items: AmountItem[] };

// An amount of '' (a line with no quantity, or one as its source wrote it) shows the name alone, with no leader.
// The spaces keep name and amount apart in the text a screen reader reads, since flex drops them from the layout.
export const AmountList = ({ items }: AmountListProps) => (
  <ul className="flex flex-col tabular-nums">
    {items.map(({ key, name, amount }) => (
      <li key={key} className="flex items-baseline gap-2 py-1.75">
        <span className="min-w-0 break-words">{name}</span>
        {amount !== '' && (
          <>
            {' '}
            <span aria-hidden="true" className="min-w-4 grow -translate-y-1 border-field border-b-2 border-dotted" />{' '}
            <span className="shrink-0 font-extrabold">{amount}</span>
          </>
        )}
      </li>
    ))}
  </ul>
);
