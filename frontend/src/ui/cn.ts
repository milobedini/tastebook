import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Without Enamel's names, tailwind-merge reads text-small as a text colour and drops it next to text-ink.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-xl', 'display-l', 'display-m', 'title', 'step', 'body', 'small', 'label'],
      radius: ['pill', 'card', 'photo', 'field']
    }
  }
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
