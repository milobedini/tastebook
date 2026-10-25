import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

const renderDebounced = () =>
  renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } });

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first value at once', () => {
    const { result } = renderDebounced();

    expect(result.current).toBe('a');
  });

  it('settles on a new value once the delay has passed', () => {
    const { result, rerender } = renderDebounced();

    rerender({ value: 'ab' });
    advance(299);
    expect(result.current).toBe('a');

    advance(1);
    expect(result.current).toBe('ab');
  });

  it('restarts the delay on each change', () => {
    const { result, rerender } = renderDebounced();

    rerender({ value: 'ab' });
    advance(200);
    rerender({ value: 'abc' });
    advance(200);
    expect(result.current).toBe('a');

    advance(100);
    expect(result.current).toBe('abc');
  });
});
