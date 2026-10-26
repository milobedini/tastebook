import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type Recipe = components['schemas']['Recipe'];

const failRecipes = () => server.use(http.get('/api/recipes/', () => new HttpResponse(null, { status: 503 })));

const appleTart: Recipe = {
  id: 1,
  slug: 'apple-tart',
  title: 'Apple tart',
  description: 'Sharp apples on buttery pastry.'
};
const bananaBread: Recipe = { id: 2, slug: 'banana-bread', title: 'Banana bread', description: '' };

// Holds the next recipes response until released, so the test can see the page while the request is in flight.
const holdRecipes = (respond: () => Response) => {
  const gate = { arrive: () => {}, release: () => {} };
  const requested = new Promise<void>((resolve) => {
    gate.arrive = resolve;
  });
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get('/api/recipes/', async () => {
      gate.arrive();
      await released;
      return respond();
    })
  );
  return { requested, release: () => gate.release() };
};

// Answers each list request from `results` by its q ('' for none) and records the q each request sent.
const answerSearches = (results: Record<string, Recipe[]>) => {
  const searches: (string | null)[] = [];
  server.use(
    http.get('/api/recipes/', ({ request }) => {
      const q = new URL(request.url).searchParams.get('q');
      searches.push(q);
      return HttpResponse.json<Recipe[]>(results[q ?? ''] ?? []);
    })
  );
  return searches;
};

const headings = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

const searchBox = () => screen.getByRole('searchbox', { name: 'Search recipes' });

const recipeCount = () => screen.queryByText(/^\d+ recipes?$/)?.textContent;

describe('RecipesPage', () => {
  it('titles the tab "Recipes · Tastebook"', async () => {
    renderRoute('/recipes');

    await waitFor(() => expect(document.title).toBe('Recipes · Tastebook'));
  });

  it('shows a loading message, then the recipes in the order the API sends', async () => {
    const { release } = holdRecipes(() =>
      HttpResponse.json<Recipe[]>([
        { id: 7, slug: 'shakshuka', title: 'Shakshuka', description: 'Eggs in spiced tomatoes.' },
        { id: 3, slug: 'apple-tart', title: 'Apple tart', description: '' }
      ])
    );

    renderRoute('/recipes');

    expect(await screen.findByText('Loading recipes…')).toBeInTheDocument();
    expect(recipeCount()).toBeUndefined();

    release();

    expect(await screen.findByText('Eggs in spiced tomatoes.')).toBeInTheDocument();
    expect(recipeCount()).toBe('2 recipes');
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Shakshuka',
      'Apple tart'
    ]);
    expect(screen.getByRole('heading', { name: 'Apple tart' }).closest('li')).toHaveTextContent(/^Apple tart$/);
    expect(screen.queryByText('Loading recipes…')).not.toBeInTheDocument();
    expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
  });

  it.each([
    ['/recipes', 'No recipes yet.', 'No recipes match “xyzzy”.'],
    ['/recipes?q=xyzzy', 'No recipes match “xyzzy”.', 'No recipes yet.']
  ])('at %s, says %s when there are no recipes', async (path, shown, absent) => {
    server.use(http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>([])));

    renderRoute(path);

    expect(await screen.findByText(shown)).toBeInTheDocument();
    expect(screen.queryByText(absent)).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(recipeCount()).toBeUndefined();
  });

  it.each([
    ['1 recipe', [appleTart]],
    ['2 recipes', [appleTart, bananaBread]]
  ])('says "%s" above the list', async (count, recipes) => {
    server.use(http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>(recipes)));

    renderRoute('/recipes');

    const shown = await screen.findByText(count);
    expect(shown.compareDocumentPosition(screen.getByRole('list'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each(['/recipes', '/recipes?q=tart'])('at %s, shows an alert and a retry when the request fails', async (path) => {
    failRecipes();

    renderRoute(path);

    expect(await screen.findByRole('alert')).toHaveTextContent("The recipes couldn't be loaded.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
    expect(recipeCount()).toBeUndefined();
  });

  it('searches once typing pauses', async () => {
    const searches = answerSearches({ '': [appleTart, bananaBread], tart: [appleTart] });
    const { router } = renderRoute('/recipes');
    await screen.findByText('Banana bread');
    expect(recipeCount()).toBe('2 recipes');

    await userEvent.type(searchBox(), 'tart');

    await waitFor(() => expect(headings()).toEqual(['Apple tart']));
    expect(recipeCount()).toBe('1 recipe');
    expect(router.state.location.search).toBe('?q=tart');
    expect(searches).toEqual([null, 'tart']);
  });

  it('searches nothing under 3 characters', async () => {
    const searches = answerSearches({ '': [appleTart, bananaBread], tar: [appleTart] });
    renderRoute('/recipes?q=ta');

    expect(searchBox()).toHaveValue('ta');
    await screen.findByText('Banana bread');
    expect(headings()).toEqual(['Apple tart', 'Banana bread']);
    expect(searches).toEqual([null]);

    await userEvent.type(searchBox(), 'r');

    await waitFor(() => expect(headings()).toEqual(['Apple tart']));
    expect(searches).toEqual([null, 'tar']);
  });

  it.each([
    ['/recipes?q=tart', 'tart'],
    ['/recipes?q=%20tart%20', ' tart ']
  ])('opens the search in %s', async (path, value) => {
    const searches = answerSearches({ tart: [appleTart] });

    renderRoute(path);

    expect(searchBox()).toHaveValue(value);
    await waitFor(() => expect(headings()).toEqual(['Apple tart']));
    expect(searches).toEqual(['tart']);
  });

  it('shows the full list again when the search is cleared', async () => {
    const searches = answerSearches({ tart: [appleTart], '': [appleTart, bananaBread] });
    const { router } = renderRoute('/recipes?q=tart');
    await waitFor(() => expect(headings()).toEqual(['Apple tart']));

    await userEvent.clear(searchBox());

    await waitFor(() => expect(headings()).toEqual(['Apple tart', 'Banana bread']));
    expect(router.state.location.search).toBe('');
    expect(searches).toEqual(['tart', null]);
  });

  it('keeps the previous results while a search loads', async () => {
    renderRoute('/recipes');
    await screen.findByText('Banana bread');
    const search = holdRecipes(() => HttpResponse.json<Recipe[]>([appleTart]));

    await userEvent.type(searchBox(), 'tart');
    await search.requested;

    expect(headings()).toEqual(['Apple tart', 'Banana bread']);
    expect(screen.queryByText('Loading recipes…')).not.toBeInTheDocument();

    search.release();

    await waitFor(() => expect(headings()).toEqual(['Apple tart']));
  });

  it('comes back to the search from a recipe', async () => {
    answerSearches({ tart: [appleTart] });
    const { router } = renderRoute('/recipes?q=tart');

    await userEvent.click(await screen.findByRole('link', { name: 'Apple tart' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Apple tart' })).toBeInTheDocument();

    await act(async () => {
      await router.navigate(-1);
    });

    expect(searchBox()).toHaveValue('tart');
    expect(headings()).toEqual(['Apple tart']);
  });

  it('loads again and shows the recipes when the retry succeeds', async () => {
    failRecipes();
    renderRoute('/recipes');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const { release } = holdRecipes(() =>
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

    const { release } = holdRecipes(() => new HttpResponse(null, { status: 503 }));
    await userEvent.click(tryAgain);

    expect(await screen.findByText('Loading recipes…')).toBeInTheDocument();

    release();

    expect(await screen.findByRole('alert')).toHaveTextContent("The recipes couldn't be loaded.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('opens a recipe from its title in the list', async () => {
    renderRoute('/recipes');

    const link = await screen.findByRole('link', { name: 'Apple tart' });
    expect(link).toHaveAttribute('href', '/recipes/apple-tart');

    await userEvent.click(link);

    expect(await screen.findByRole('heading', { level: 1, name: 'Apple tart' })).toBeInTheDocument();
    expect(screen.getByText('Sharp apples on buttery pastry.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recipes' })).not.toBeInTheDocument();
  });

  it('takes the visitor home from the back link', async () => {
    renderRoute('/recipes');

    await userEvent.click(screen.getByRole('link', { name: 'Back to Tastebook' }));

    expect(await screen.findByRole('heading', { name: 'Tastebook' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recipes' })).not.toBeInTheDocument();
  });
});
