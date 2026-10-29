import { useSyncExternalStore } from 'react';

export const isLaptopQuery = '(min-width: 64rem)'; // Tailwind's lg

export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches
  );
