import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type Recipe = components['schemas']['Recipe'];

const shakshuka: Recipe = {
  id: 7,
  slug: 'shakshuka',
  title: 'Shakshuka',
  description: 'Eggs in spiced tomatoes.',
  cuisines: []
};

const failRecipe = () => server.use(http.get('/api/recipes/:slug/', () => new HttpResponse(null, { status: 503 })));

// Holds the next recipe response until released, so the test can see the page while the request is in flight.
const holdRecipe = (respond: () => Response) => {
  const gate = { release: () => {} };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get('/api/recipes/:slug/', async () => {
      await released;
      return respond();
    })
  );
  return () => gate.release();
};

describe('RecipePage', () => {
  it('shows a loading message, then the recipe', async () => {
    const release = holdRecipe(() => HttpResponse.json<Recipe>(shakshuka));

    renderRoute('/recipes/shakshuka');

    expect(await screen.findByText('Loading recipe…')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Recipe · Tastebook'));

    release();

    expect(await screen.findByRole('heading', { level: 1, name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.getByText('Eggs in spiced tomatoes.')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Shakshuka · Tastebook'));
    expect(screen.queryByText('Loading recipe…')).not.toBeInTheDocument();
  });

  it('shows no description line when the description is empty', async () => {
    renderRoute('/recipes/banana-bread');

    expect(await screen.findByRole('heading', { name: 'Banana bread' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(/^Banana breadAll recipesBack to Tastebook$/);
  });

  it.each([
    ['Cuisine: French', [{ slug: 'french', name: 'French' }]],
    [
      'Cuisines: Japanese, Mexican',
      [
        { slug: 'japanese', name: 'Japanese' },
        { slug: 'mexican', name: 'Mexican' }
      ]
    ]
  ])('shows the recipe\'s cuisines as "%s"', async (text, cuisines) => {
    server.use(http.get('/api/recipes/:slug/', () => HttpResponse.json<Recipe>({ ...shakshuka, cuisines })));

    renderRoute('/recipes/shakshuka');

    const shown = await screen.findByText(text);
    expect(shown.compareDocumentPosition(screen.getByText('Eggs in spiced tomatoes.'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("says the recipe isn't found for an unknown address", async () => {
    renderRoute('/recipes/no-such-recipe');

    expect(await screen.findByRole('heading', { name: 'Recipe not found' })).toBeInTheDocument();
    expect(screen.getByText("This recipe doesn't exist or has been removed.")).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Recipe not found · Tastebook'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('shows an alert and a retry when the request fails', async () => {
    failRecipe();

    renderRoute('/recipes/shakshuka');

    expect(await screen.findByRole('alert')).toHaveTextContent("The recipe couldn't be loaded.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recipe not found' })).not.toBeInTheDocument();
  });

  it('loads again and shows the recipe when the retry succeeds', async () => {
    failRecipe();
    renderRoute('/recipes/shakshuka');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const release = holdRecipe(() => HttpResponse.json<Recipe>(shakshuka));
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Loading recipe…')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    release();

    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('brings the alert back when the retry fails again', async () => {
    failRecipe();
    renderRoute('/recipes/shakshuka');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const release = holdRecipe(() => new HttpResponse(null, { status: 503 }));
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Loading recipe…')).toBeInTheDocument();

    release();

    expect(await screen.findByRole('alert')).toHaveTextContent("The recipe couldn't be loaded.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it.each([
    ['/recipes/apple-tart', 'All recipes', 'Recipes'],
    ['/recipes/apple-tart', 'Back to Tastebook', 'Tastebook'],
    ['/recipes/no-such-recipe', 'All recipes', 'Recipes'],
    ['/recipes/no-such-recipe', 'Back to Tastebook', 'Tastebook']
  ])('from %s, follows "%s" to the %s page', async (path, linkName, headingName) => {
    renderRoute(path);

    await userEvent.click(screen.getByRole('link', { name: linkName }));

    expect(await screen.findByRole('heading', { level: 1, name: headingName })).toBeInTheDocument();
  });
});
