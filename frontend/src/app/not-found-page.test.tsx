import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderRoute } from '../test/render-route';

describe('NotFoundPage', () => {
  it.each(['/nope', '/recipes/missing/deeper'])('shows "Page not found" for %s', async (path) => {
    renderRoute(path);

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Tastebook' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('searchbox', { name: 'Search recipes' })).toBeInTheDocument();
  });

  it('titles the tab "Page not found · Tastebook" and resets it on the way home', async () => {
    renderRoute('/nope');

    await waitFor(() => expect(document.title).toBe('Page not found · Tastebook'));

    await userEvent.click(screen.getByRole('link', { name: 'Back to Tastebook' }));

    await waitFor(() => expect(document.title).toBe('Tastebook'));
  });

  it('takes the visitor home from the back link', async () => {
    renderRoute('/nope');

    await userEvent.click(await screen.findByRole('link', { name: 'Back to Tastebook' }));

    expect(await screen.findByRole('heading', { name: 'Tastebook' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument();
  });
});
