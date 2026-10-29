// jsdom has no matchMedia, so setup.ts stubs it: every query matches on a laptop and none on a phone, the default.
const media = { isLaptop: false };
const listeners = new Set<() => void>();

export const matchMedia = (query: string): MediaQueryList => ({
  matches: media.isLaptop,
  media: query,
  onchange: null,
  addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
  removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false
});

// Before renderRoute, it sets the layout the page first renders; after, it turns the device, inside act.
export const setLaptop = (matches: boolean) => {
  media.isLaptop = matches;
  [...listeners].map((listener) => listener());
};
