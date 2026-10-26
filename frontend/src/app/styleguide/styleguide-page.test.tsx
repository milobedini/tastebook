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

  it('steps servings up and down, and stops at the minimum', async () => {
    renderRoute('/styleguide');
    await screen.findByRole('heading', { level: 1, name: 'Style guide' });

    await userEvent.click(screen.getByRole('button', { name: 'More servings' }));
    expect(screen.getByText('Serves 5')).toBeInTheDocument();

    const fewer = screen.getByRole('button', { name: 'Fewer servings' });
    await userEvent.click(fewer);
    await userEvent.click(fewer);
    await userEvent.click(fewer);
    await userEvent.click(fewer);

    expect(screen.getByText('Serves 1')).toBeInTheDocument();
    expect(fewer).toBeDisabled();
  });

  it('presses a filter chip', async () => {
    renderRoute('/styleguide');
    const chip = await screen.findByRole('button', { name: 'Under 30 min' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('ticks a shopping list row', async () => {
    renderRoute('/styleguide');
    const row = await screen.findByRole('checkbox', { name: '2 courgettes' });
    expect(row).not.toBeChecked();

    await userEvent.click(row);

    expect(row).toBeChecked();
  });

  it('describes a field by its error, or else by its help', async () => {
    renderRoute('/styleguide');

    const servings = await screen.findByRole('textbox', { name: 'Servings' });
    expect(servings).toHaveAttribute('aria-invalid', 'true');
    expect(servings).toHaveAccessibleDescription('Enter a number, like 4.');

    const title = screen.getByRole('textbox', { name: 'Recipe title' });
    expect(title).toHaveAccessibleDescription('Shown on cards and at the top of the recipe.');
    expect(title).not.toHaveAttribute('aria-invalid');
  });

  it("names every icon button, and keeps the toggle's name as its pressed state changes", async () => {
    renderRoute('/styleguide');
    const favourite = await screen.findByRole('button', { name: 'Favourite' });
    expect(favourite).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();

    await userEvent.click(favourite);

    expect(favourite).toHaveAttribute('aria-pressed', 'true');
    expect(favourite).toHaveAccessibleName('Favourite');
  });

  it('shows a toast with its action', async () => {
    renderRoute('/styleguide');

    await userEvent.click(await screen.findByRole('button', { name: 'Show a toast' }));

    expect(await screen.findByText('Saved to Favourites')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('asks before deleting, and Cancel returns focus to the trigger', async () => {
    renderRoute('/styleguide');
    const section = await screen.findByRole('region', { name: "Confirming something you can't undo" });
    const trigger = within(section).getByRole('button', { name: 'Delete account' });

    await userEvent.click(trigger);
    const dialog = screen.getByRole('alertdialog', { name: 'Delete your account?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('makes the recipe card a link to the recipe', async () => {
    renderRoute('/styleguide');

    expect(await screen.findByRole('link', { name: 'Courgette and lemon orzo' })).toHaveAttribute(
      'href',
      '/recipes/courgette-and-lemon-orzo'
    );
  });
});
