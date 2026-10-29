// jsdom has no matchMedia, so setup.ts stubs it: every query matches on a laptop and none on a phone, the default.
const media = { isLaptop: false };

export const matchMedia = (query: string): MediaQueryList => ({
  matches: media.isLaptop,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false
});

// Call before renderRoute: the page reads the layout as it first renders.
export const setLaptop = (matches: boolean) => {
  media.isLaptop = matches;
};
