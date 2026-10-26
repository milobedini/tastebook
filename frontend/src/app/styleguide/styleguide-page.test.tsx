import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderRoute } from '../../test/render-route';

const themeButton = (name: string) =>
  within(screen.getByRole('group', { name: 'Theme' })).getByRole('button', { name });

describe('StyleguidePage', () => {
  it('shows the page and the token sections', async () => {
    renderRoute('/styleguide');

    expect(await screen.findByRole('heading', { level: 1, name: 'Style guide' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Colour' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Space and shape' })).toBeInTheDocument();
  });

  it.each([
    ['Light', 'light'],
    ['Dark', 'dark']
  ])('switches the theme to %s', async (option, value) => {
    renderRoute('/styleguide');
    await screen.findByRole('heading', { level: 1, name: 'Style guide' });

    await userEvent.click(themeButton(option));

    expect(document.documentElement).toHaveAttribute('data-theme', value);
    expect(themeButton(option)).toHaveAttribute('aria-pressed', 'true');
    expect(themeButton('System')).toHaveAttribute('aria-pressed', 'false');
  });

  it('goes back to following the phone with System', async () => {
    renderRoute('/styleguide');
    await screen.findByRole('heading', { level: 1, name: 'Style guide' });

    await userEvent.click(themeButton('Dark'));
    await userEvent.click(themeButton('System'));

    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(themeButton('System')).toHaveAttribute('aria-pressed', 'true');
  });
});
