import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { matchMedia, setLaptop } from './media';
import { server } from './server';

// jsdom lays nothing out, so it has neither; Radix measures with one and the combobox scrolls its active option.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= () => {};
window.matchMedia ??= matchMedia;

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  setLaptop(false);
});
afterAll(() => server.close());
