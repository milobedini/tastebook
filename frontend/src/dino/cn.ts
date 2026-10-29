import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Without Picnic's names, tailwind-merge reads text-small as a text colour and drops it next to text-ink.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-xl', 'display-l', 'title', 'caption', 'step-number', 'step', 'timer', 'body', 'small', 'label'],
      radius: ['pill', 'sheet', 'timer', 'card', 'note', 'check'],
      shadow: ['press', 'lift']
    }
  }
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
