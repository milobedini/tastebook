// jsdom has no matchMedia, so setup.ts stubs it: every query matches on a laptop and none on a phone, the default.
const media = { isLaptop: false };
const listeners = new Set<EventListenerOrEventListenerObject>();

export const matchMedia = (query: string): MediaQueryList => ({
  matches: media.isLaptop,
  media: query,
  onchange: null,
  addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
    listeners.add(listener);
  },
  removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
    listeners.delete(listener);
  },
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false
});

// Before renderRoute, it sets the layout the page first renders; after, it turns the device, inside act.
export const setLaptop = (matches: boolean) => {
  media.isLaptop = matches;
  const change = new Event('change');
  [...listeners].map((listener) => (typeof listener === 'function' ? listener(change) : listener.handleEvent(change)));
};
