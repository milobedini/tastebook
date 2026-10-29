import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type RecipeSummary = components['schemas']['RecipeSummary'];

const appleTart: RecipeSummary = {
  id: 1,
  slug: 'apple-tart',
  title: 'Apple tart',
  description: 'Sharp apples on buttery pastry.',
  cuisines: [{ slug: 'french', name: 'French' }],
  difficulty: 'medium',
  total_minutes: 100,
  photo: null,
  diet_tags: []
};

// Answers only a search for "tart", so the list shows a recipe only once the search reached it.
const answerTartSearch = () =>
  server.use(
    http.get('/api/recipes/', ({ request }) =>
      HttpResponse.json<RecipeSummary[]>(new URL(request.url).searchParams.get('q') === 'tart' ? [appleTart] : [])
    )
  );

const searchBox = () => screen.getByRole('searchbox', { name: 'Search recipes' });

const searchButton = () => screen.getByRole('button', { name: 'Search recipes' });

describe('AppLayout', () => {
  it.each(['/', '/recipes', '/recipes/apple-tart', '/no-such-page'])(
    'shows the top bar with the wordmark linking home on %s',
    (path) => {
      renderRoute(path);

      // getByRole fails on a second banner, so there's exactly one.
      const banner = screen.getByRole('banner');
      expect(within(banner).getByRole('link', { name: 'Tastebook' })).toHaveAttribute('href', '/');
    }
  );

  it('opens the recipe list with the search typed on a recipe', async () => {
    answerTartSearch();
    const { router } = renderRoute('/recipes/apple-tart');
    await screen.findByRole('heading', { level: 1, name: 'Apple tart' });

    await userEvent.type(searchBox(), 'tart');

    expect(router.state.location.pathname).toBe('/recipes');
    expect(router.state.location.search).toBe('?q=tart');
    expect(searchBox()).toHaveValue('tart');
    expect(searchBox()).toHaveFocus();
    expect(await screen.findByRole('heading', { level: 2, name: 'Apple tart' })).toBeInTheDocument();
  });

  it('goes back to the recipe, with the field empty, after a search typed there', async () => {
    answerTartSearch();
    const { router } = renderRoute('/recipes/apple-tart');
    await screen.findByRole('heading', { level: 1, name: 'Apple tart' });
    await userEvent.type(searchBox(), 'tart');

    await act(async () => {
      await router.navigate(-1);
    });

    expect(router.state.location.pathname).toBe('/recipes/apple-tart');
    expect(await screen.findByRole('heading', { level: 1, name: 'Apple tart' })).toBeInTheDocument();
    expect(searchBox()).toHaveValue('');
  });

  it('opens the field from the search button and closes it again while empty', async () => {
    renderRoute('/');
    expect(searchButton()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(searchButton());

    expect(searchButton()).toHaveAttribute('aria-expanded', 'true');
    expect(searchBox()).toHaveFocus();

    await userEvent.click(searchButton());

    expect(searchButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the field open while a search is on', async () => {
    renderRoute('/recipes?q=tart');
    expect(searchButton()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(searchButton());

    expect(searchButton()).toHaveAttribute('aria-expanded', 'true');
    expect(searchBox()).toHaveFocus();
  });
});
