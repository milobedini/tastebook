import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type Recipe = components['schemas']['Recipe'];

const failRecipes = () => server.use(http.get('/api/recipes/', () => new HttpResponse(null, { status: 503 })));

// Holds the next recipes response until released, so the test can see the page while the request is in flight.
const holdRecipes = (respond: () => Response) => {
  const gate = { release: () => {} };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get('/api/recipes/', async () => {
      await released;
      return respond();
    })
  );
  return () => gate.release();
};

describe('RecipesPage', () => {
  it('titles the tab "Recipes · Tastebook"', async () => {
    renderRoute('/recipes');

    await waitFor(() => expect(document.title).toBe('Recipes · Tastebook'));
  });

  it('shows a loading message, then the recipes in the order the API sends', async () => {
    const release = holdRecipes(() =>
      HttpResponse.json<Recipe[]>([
        { id: 7, slug: 'shakshuka', title: 'Shakshuka', description: 'Eggs in spiced tomatoes.' },
        { id: 3, slug: 'apple-tart', title: 'Apple tart', description: '' }
      ])
    );

    renderRoute('/recipes');

    expect(await screen.findByText('Loading recipes…')).toBeInTheDocument();

    release();

    expect(await screen.findByText('Eggs in spiced tomatoes.')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Shakshuka',
      'Apple tart'
    ]);
    expect(screen.getByRole('heading', { name: 'Apple tart' }).closest('li')).toHaveTextContent(/^Apple tart$/);
    expect(screen.queryByText('Loading recipes…')).not.toBeInTheDocument();
    expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
  });

  it('says so when there are no recipes', async () => {
    server.use(http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>([])));

    renderRoute('/recipes');

    expect(await screen.findByText('No recipes yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows an alert and a retry when the request fails', async () => {
    failRecipes();

    renderRoute('/recipes');

    expect(await screen.findByRole('alert')).toHaveTextContent("The recipes couldn't be loaded.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
  });

  it('loads again and shows the recipes when the retry succeeds', async () => {
    failRecipes();
    renderRoute('/recipes');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const release = holdRecipes(() =>
      HttpResponse.json<Recipe[]>([
        { id: 7, slug: 'shakshuka', title: 'Shakshuka', description: 'Eggs in spiced tomatoes.' }
      ])
    );
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Loading recipes…')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    release();

    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('brings the alert back when the retry fails again', async () => {
    failRecipes();
    renderRoute('/recipes');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const release = holdRecipes(() => new HttpResponse(null, { status: 503 }));
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Loading recipes…')).toBeInTheDocument();

    release();

    expect(await screen.findByRole('alert')).toHaveTextContent("The recipes couldn't be loaded.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('takes the visitor home from the back link', async () => {
    renderRoute('/recipes');

    await userEvent.click(screen.getByRole('link', { name: 'Back to Tastebook' }));

    expect(await screen.findByRole('heading', { name: 'Tastebook' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recipes' })).not.toBeInTheDocument();
  });
});
