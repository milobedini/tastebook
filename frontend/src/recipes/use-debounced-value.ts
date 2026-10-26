import { useEffect, useState } from 'react';

// Syncs with a timer, not with React state: the value settles once it stops changing for delayMs.
export const useDebouncedValue = <Value>(value: Value, delayMs: number): Value => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
};
