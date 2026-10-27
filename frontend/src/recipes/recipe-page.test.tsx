import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type Recipe = components['schemas']['Recipe'];
type IngredientLine = components['schemas']['IngredientLine'];

const shakshuka: Recipe = {
  id: 7,
  slug: 'shakshuka',
  title: 'Shakshuka',
  description: 'Eggs in spiced tomatoes.',
  cuisines: [],
  courses: [{ slug: 'main', name: 'Main' }],
  difficulty: 'easy',
  prep_minutes: 10,
  cook_minutes: 25,
  extra_minutes: 0,
  extra_label: '',
  total_minutes: 35,
  servings: 2,
  yield_amount: null,
  yield_unit: '',
  equipment: [{ slug: 'hob', name: 'Hob' }],
  one_pot: true,
  source: 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)',
  ingredient_lines: [],
  ingredient_groups: [],
  steps: []
};

// Each term of the recipe's details with its definition, in the order the page shows them.
const facts = () => {
  const definitions = screen.getAllByRole('definition');
  return screen.getAllByRole('term').map((term, index) => [term.textContent, definitions[index]?.textContent]);
};

const paragraphs = () => screen.queryAllByRole('paragraph').map((paragraph) => paragraph.textContent);

const tags = () => screen.getAllByRole('listitem').map((item) => item.textContent);

const line = (id: number, name: string, fields: Partial<IngredientLine> = {}): IngredientLine => ({
  id,
  amount: null,
  amount_max: null,
  unit: '',
  ingredient: { slug: name.replaceAll(' ', '-'), name },
  note: '',
  optional: false,
  ...fields
});

const withIngredientsAndMethod: Recipe = {
  ...shakshuka,
  ingredient_lines: [
    line(1, 'olive oil', { amount: 1.5, unit: 'tbsp' }),
    line(2, 'eggs', { amount: 2, amount_max: 3 }),
    line(3, 'salt', { note: 'to taste' })
  ],
  ingredient_groups: [
    {
      id: 1,
      name: 'For the sauce',
      lines: [
        line(4, 'onion', { amount: 1, note: 'finely chopped' }),
        line(5, 'garlic', { amount: 2, unit: 'clove', note: 'crushed' }),
        line(6, 'chopped tomatoes', { amount: 1, unit: 'tin' })
      ]
    },
    { id: 2, name: 'To serve', lines: [line(7, 'coriander', { unit: 'handful', optional: true })] },
    { id: 3, name: 'Not filled in yet', lines: [] }
  ],
  steps: [
    { id: 1, text: 'Fry the onion in the oil until soft.' },
    { id: 2, text: 'Add the garlic and tomatoes and simmer for 10 minutes.' },
    { id: 3, text: 'Crack in the eggs, cover and cook until set.' }
  ]
};

const itemsOf = (list: HTMLElement) =>
  within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent);

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

  it.each([
    ['apple-tart', 'Apple tart', ['Sharp apples on buttery pastry.']],
    ['banana-bread', 'Banana bread', []]
  ])('shows a description line only when the recipe has one (%s)', async (slug, title, descriptions) => {
    renderRoute(`/recipes/${slug}`);

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(paragraphs()).toEqual(descriptions);
  });

  it("shows the recipe's difficulty, one-pot, times, servings, equipment and source credit", async () => {
    server.use(
      http.get('/api/recipes/:slug/', () =>
        HttpResponse.json<Recipe>({ ...shakshuka, cuisines: [{ slug: 'french', name: 'French' }] })
      )
    );

    renderRoute('/recipes/shakshuka');

    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(tags()).toEqual(['Easy', 'One-pot']);
    expect(facts()).toEqual([
      ['Cuisine', 'French'],
      ['Course', 'Main'],
      ['Prep', '10 min'],
      ['Cook', '25 min'],
      ['Total', '35 min'],
      ['Serves', '2'],
      ['Equipment', 'Hob'],
      ['Source', 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)']
    ]);
  });

  it('shows extra time with its label, a yield, and several cuisines, courses and pieces of equipment', async () => {
    server.use(
      http.get('/api/recipes/:slug/', () =>
        HttpResponse.json<Recipe>({
          ...shakshuka,
          cuisines: [
            { slug: 'japanese', name: 'Japanese' },
            { slug: 'mexican', name: 'Mexican' }
          ],
          courses: [
            { slug: 'baking', name: 'Baking' },
            { slug: 'dessert', name: 'Dessert' }
          ],
          difficulty: 'hard',
          prep_minutes: 20,
          cook_minutes: 45,
          extra_minutes: 120,
          extra_label: 'proving',
          total_minutes: 185,
          servings: null,
          yield_amount: 12,
          yield_unit: 'buns',
          equipment: [
            { slug: 'oven', name: 'Oven' },
            { slug: 'stand-mixer', name: 'Stand mixer' }
          ],
          one_pot: false
        })
      )
    );

    renderRoute('/recipes/shakshuka');

    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(tags()).toEqual(['Hard']);
    expect(facts()).toEqual([
      ['Cuisines', 'Japanese, Mexican'],
      ['Courses', 'Baking, Dessert'],
      ['Prep', '20 min'],
      ['Cook', '45 min'],
      ['Proving', '2 hr'],
      ['Total', '3 hr 5 min'],
      ['Makes', '12 buns'],
      ['Equipment', 'Oven, Stand mixer'],
      ['Source', 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)']
    ]);
  });

  it('leaves out the cuisine, course, equipment and source rows a recipe has none of', async () => {
    renderRoute('/recipes/banana-bread');

    expect(await screen.findByRole('heading', { name: 'Banana bread' })).toBeInTheDocument();
    expect(facts()).toEqual([
      ['Prep', '15 min'],
      ['Cook', '1 hr'],
      ['Total', '1 hr 15 min'],
      ['Makes', '1 loaf']
    ]);
  });

  it('shows the ingredients, ungrouped lines first and then each group under its name, and the method as numbered steps', async () => {
    server.use(http.get('/api/recipes/:slug/', () => HttpResponse.json<Recipe>(withIngredientsAndMethod)));

    renderRoute('/recipes/shakshuka');

    const ingredients = await screen.findByRole('region', { name: 'Ingredients' });
    expect(
      within(ingredients)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(['For the sauce', 'To serve']);
    expect(within(ingredients).getAllByRole('list').map(itemsOf)).toEqual([
      ['1.5 tbsp olive oil', '2–3 eggs', 'salt, to taste'],
      ['1 onion, finely chopped', '2 cloves garlic, crushed', '1 tin chopped tomatoes'],
      ['handful coriander (optional)']
    ]);
    const method = screen.getByRole('region', { name: 'Method' });
    const steps = within(method).getByRole('list');
    expect(steps.tagName).toBe('OL');
    expect(itemsOf(steps)).toEqual([
      'Fry the onion in the oil until soft.',
      'Add the garlic and tomatoes and simmer for 10 minutes.',
      'Crack in the eggs, cover and cook until set.'
    ]);
  });

  it.each([
    ['shakshuka', ['Ingredients', 'Method']],
    ['banana-bread', []]
  ])('shows the ingredients and method sections only when the recipe has them (%s)', async (slug, headings) => {
    server.use(http.get('/api/recipes/shakshuka/', () => HttpResponse.json<Recipe>(withIngredientsAndMethod)));

    renderRoute(`/recipes/${slug}`);

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(headings);
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
