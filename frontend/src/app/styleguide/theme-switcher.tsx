import { useState } from 'react';

import { SegmentedControl } from '../../ui';

type Theme = 'system' | 'light' | 'dark';

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

// The root's data-theme attribute owns the theme; this state only mirrors it.
const readTheme = (): Theme => {
  const theme = document.documentElement.dataset.theme;
  return theme === 'light' || theme === 'dark' ? theme : 'system';
};

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(readTheme);

  const changeTheme = (next: Theme) => {
    if (next === 'system') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = next;
    }
    setTheme(next);
  };

  return <SegmentedControl label="Theme" options={themeOptions} value={theme} onValueChange={changeTheme} />;
};
