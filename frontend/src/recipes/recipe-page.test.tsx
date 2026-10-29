import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type Recipe = components['schemas']['Recipe'];
type IngredientLine = components['schemas']['IngredientLine'];
type RecipePhoto = components['schemas']['RecipePhoto'];

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
  photo: null,
  diet_tags: [],
  servings: 2,
  yield_amount: null,
  yield_unit: '',
  equipment: [{ slug: 'hob', name: 'Hob' }],
  one_pot: true,
  source: 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)',
  source_url: '',
  ingredient_lines: [],
  ingredient_groups: [],
  steps: [],
  diet_tag_conflicts: []
};

const photo: RecipePhoto = {
  thumbnails: [
    { width: 330, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shakshuka.jpg/330px-Shakshuka.jpg' },
    { width: 1280, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shakshuka.jpg/1280px-Shakshuka.jpg' }
  ],
  author: 'Jane Doe',
  licence: 'CC BY-SA 4.0',
  source_url: 'https://commons.wikimedia.org/wiki/File:Shakshuka.jpg'
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
  original_text: '',
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

  it.each([
    [photo, ['Shakshuka']],
    [null, []]
  ])('shows a photo above the title only when the recipe has one', async (recipePhoto, images) => {
    server.use(http.get('/api/recipes/:slug/', () => HttpResponse.json<Recipe>({ ...shakshuka, photo: recipePhoto })));

    renderRoute('/recipes/shakshuka');

    expect(await screen.findByRole('heading', { level: 1, name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.queryAllByRole('img').map((image) => image.getAttribute('alt'))).toEqual(images);
  });

  it('loads the photo at once at the page width without cookies, credited with its author, licence and a link to its page', async () => {
    server.use(http.get('/api/recipes/:slug/', () => HttpResponse.json<Recipe>({ ...shakshuka, photo })));

    renderRoute('/recipes/shakshuka');

    const figure = await screen.findByRole('figure');
    expect(figure).toHaveTextContent(/^Photo by Jane Doe, CC BY-SA 4\.0, via Wikimedia Commons$/);
    const image = within(figure).getByRole('img', { name: 'Shakshuka' });
    expect(image).toHaveAttribute(
      'srcset',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shakshuka.jpg/330px-Shakshuka.jpg 330w, ' +
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shakshuka.jpg/1280px-Shakshuka.jpg 1280w'
    );
    expect(image).toHaveAttribute('sizes', '(min-width: 42rem) 40rem, calc(100vw - 2rem)');
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('crossorigin', 'anonymous');
    expect(within(figure).getByRole('link', { name: 'Wikimedia Commons' })).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Shakshuka.jpg'
    );
  });

  it("shows the cuisine plate without a credit when the photo can't load", async () => {
    server.use(
      http.get('/api/recipes/:slug/', () =>
        HttpResponse.json<Recipe>({ ...shakshuka, cuisines: [{ slug: 'french', name: 'French' }], photo })
      )
    );

    renderRoute('/recipes/shakshuka');

    const heading = await screen.findByRole('heading', { level: 1, name: 'Shakshuka' });
    expect(heading.previousElementSibling).toHaveRole('figure');

    fireEvent.error(screen.getByRole('img', { name: 'Shakshuka' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/Photo by/)).not.toBeInTheDocument();
    // The plate is decorative, so it has no role: it's found by where the photo was and the cuisine's colour it takes.
    expect(heading.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
    expect(heading.previousElementSibling).toHaveAttribute(
      'style',
      expect.stringContaining('background-color: var(--cuisine-french')
    );
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

  it.each([
    ['https://en.wikibooks.org/wiki/Cookbook:Shakshouka', 1],
    ['', 0]
  ])(
    'links the source credit to the original page only when the recipe has its address (%s)',
    async (sourceUrl, count) => {
      server.use(
        http.get('/api/recipes/:slug/', () => HttpResponse.json<Recipe>({ ...shakshuka, source_url: sourceUrl }))
      );

      renderRoute('/recipes/shakshuka');

      expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
      expect(facts()).toContainEqual(['Source', 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)']);
      const links = screen.queryAllByRole('link', { name: 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)' });
      expect(links).toHaveLength(count);
      expect(links.map((link) => link.getAttribute('href'))).toEqual(sourceUrl === '' ? [] : [sourceUrl]);
    }
  );

  it.each<[Recipe['diet_tags'], Recipe['diet_tag_conflicts'], string[], string[]]>([
    [[], [], ['Easy', 'One-pot'], []],
    [
      ['vegetarian', 'vegan', 'dairy_free'],
      [{ ingredient: { slug: 'parmesan', name: 'parmesan' }, diet_tags: ['vegan', 'dairy_free'] }],
      ['Easy', 'One-pot', 'Vegetarian', 'Vegan', 'Dairy-free'],
      ['Leave out the parmesan to keep it vegan and dairy-free.']
    ],
    [
      ['vegetarian', 'vegan', 'gluten_free', 'dairy_free'],
      [
        { ingredient: { slug: 'bacon', name: 'bacon' }, diet_tags: ['vegetarian', 'vegan'] },
        { ingredient: { slug: 'eggs', name: 'eggs' }, diet_tags: ['vegan'] },
        { ingredient: { slug: 'croutons', name: 'butter croutons' }, diet_tags: ['vegan', 'gluten_free', 'dairy_free'] }
      ],
      ['Easy', 'One-pot', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'],
      [
        'Leave out the bacon to keep it vegetarian and vegan.',
        'Leave out the eggs to keep it vegan.',
        'Leave out the butter croutons to keep it vegan, gluten-free and dairy-free.'
      ]
    ]
  ])(
    'shows the diet tags %j and says which optional ingredient would take one away',
    async (dietTags, conflicts, shownTags, sentences) => {
      server.use(
        http.get('/api/recipes/:slug/', () =>
          HttpResponse.json<Recipe>({ ...shakshuka, diet_tags: dietTags, diet_tag_conflicts: conflicts })
        )
      );

      renderRoute('/recipes/shakshuka');

      expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
      expect(tags()).toEqual(shownTags);
      expect(paragraphs()).toEqual(['Eggs in spiced tomatoes.', ...sentences]);
    }
  );

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
          photo: null,
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

  it('scales every ingredient amount as the servings change, rounded to what can be measured', async () => {
    server.use(http.get('/api/recipes/:slug/', () => HttpResponse.json<Recipe>(withIngredientsAndMethod)));

    renderRoute('/recipes/shakshuka');

    const ingredients = await screen.findByRole('region', { name: 'Ingredients' });
    const amounts = () => within(ingredients).getAllByRole('list').map(itemsOf);
    // The stepper shows the servings, so the details leave them out.
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Course',
      'Prep',
      'Cook',
      'Total',
      'Equipment',
      'Source'
    ]);
    expect(within(ingredients).getByRole('status')).toHaveTextContent('Serves 2');

    await userEvent.click(within(ingredients).getByRole('button', { name: 'More servings' }));

    expect(within(ingredients).getByRole('status')).toHaveTextContent('Serves 3');
    expect(amounts()).toEqual([
      ['2.25 tbsp olive oil', '3–5 eggs', 'salt, to taste'],
      ['1–2 onion, finely chopped', '3 cloves garlic, crushed', '1–2 tins chopped tomatoes'],
      ['handful coriander (optional)']
    ]);

    await userEvent.click(within(ingredients).getByRole('button', { name: 'Fewer servings' }));
    await userEvent.click(within(ingredients).getByRole('button', { name: 'Fewer servings' }));

    expect(within(ingredients).getByRole('status')).toHaveTextContent('Serves 1');
    expect(within(ingredients).getByRole('button', { name: 'Fewer servings' })).toBeDisabled();
    expect(amounts()).toEqual([
      ['0.75 tbsp olive oil', '1–2 eggs', 'salt, to taste'],
      ['1 onion, finely chopped', '1 clove garlic, crushed', '1 tin chopped tomatoes'],
      ['handful coriander (optional)']
    ]);
  });

  it('scales the amounts by the yield for a recipe that makes a number of something', async () => {
    server.use(
      http.get('/api/recipes/:slug/', () =>
        HttpResponse.json<Recipe>({
          ...shakshuka,
          servings: null,
          yield_amount: 16,
          yield_unit: 'cookies',
          ingredient_lines: [
            line(1, 'butter', { amount: 125, unit: 'g' }),
            line(2, 'bicarbonate of soda', { amount: 0.5, unit: 'tsp' }),
            line(3, 'salt', { amount: 1, unit: 'pinch' })
          ]
        })
      )
    );

    renderRoute('/recipes/shakshuka');

    const ingredients = await screen.findByRole('region', { name: 'Ingredients' });
    expect(screen.getAllByRole('term').map((term) => term.textContent)).not.toContain('Makes');
    expect(within(ingredients).getByRole('status')).toHaveTextContent('Makes 16 cookies');

    await userEvent.click(within(ingredients).getByRole('button', { name: 'Make more' }));

    expect(within(ingredients).getByRole('status')).toHaveTextContent('Makes 17 cookies');
    expect(itemsOf(within(ingredients).getByRole('list'))).toEqual([
      '135 g butter',
      '0.5 tsp bicarbonate of soda',
      '1 pinch salt'
    ]);
  });

  it('opens in metric with small volumes in spoons, and switches to US customary for amounts and oven temperatures', async () => {
    server.use(
      http.get('/api/recipes/:slug/', () =>
        HttpResponse.json<Recipe>({
          ...shakshuka,
          ingredient_lines: [
            line(1, 'vanilla extract', { amount: 5, unit: 'ml' }),
            line(2, 'plain flour', { amount: 1, unit: 'cup' }),
            line(3, 'butter', { amount: 200, unit: 'g', note: 'softened' }),
            line(4, 'garlic', { amount: 2, unit: 'clove' }),
            line(5, 'salt', { amount: 1, unit: 'pinch' })
          ],
          steps: [
            { id: 1, text: 'Heat the oven to 180°C (160°C fan).' },
            { id: 2, text: 'Rub 200 g of the butter into the flour.' }
          ]
        })
      )
    );

    renderRoute('/recipes/shakshuka');

    const ingredients = await screen.findByRole('region', { name: 'Ingredients' });
    const amounts = () => itemsOf(within(ingredients).getByRole('list'));
    const steps = () => itemsOf(within(screen.getByRole('region', { name: 'Method' })).getByRole('list'));
    const units = screen.getByRole('group', { name: 'Units' });
    expect(within(units).getByRole('radio', { name: 'Metric' })).toBeChecked();
    expect(amounts()).toEqual([
      '1 tsp vanilla extract',
      '240 ml plain flour',
      '200 g butter, softened',
      '2 cloves garlic',
      '1 pinch salt'
    ]);
    expect(steps()).toEqual(['Heat the oven to 180°C (160°C fan).', 'Rub 200 g of the butter into the flour.']);
    // Written by hand, so there's no original that differs.
    expect(within(ingredients).queryByRole('button', { name: 'Show original' })).not.toBeInTheDocument();

    await userEvent.click(within(units).getByRole('radio', { name: 'US' }));

    expect(within(units).getByRole('radio', { name: 'US' })).toBeChecked();
    expect(amounts()).toEqual([
      '1 tsp vanilla extract',
      '1 cup plain flour',
      '7 oz butter, softened',
      '2 cloves garlic',
      '1 pinch salt'
    ]);
    expect(steps()).toEqual(['Heat the oven to 355°F (320°F fan).', 'Rub 200 g of the butter into the flour.']);

    await userEvent.click(within(ingredients).getByRole('button', { name: 'More servings' }));

    expect(amounts()).toEqual([
      '1.5 tsp vanilla extract',
      '1.5 cups plain flour',
      '10.5 oz butter, softened',
      '3 cloves garlic',
      '1–2 pinches salt'
    ]);

    await userEvent.click(within(units).getByRole('radio', { name: 'Metric' }));

    expect(amounts()).toEqual([
      '1.5 tsp vanilla extract',
      '360 ml plain flour',
      '300 g butter, softened',
      '3 cloves garlic',
      '1–2 pinches salt'
    ]);
    expect(steps()).toEqual(['Heat the oven to 180°C (160°C fan).', 'Rub 200 g of the butter into the flour.']);
  });

  it('shows the amounts and method as the source wrote them, offered only while they differ from what is shown', async () => {
    server.use(
      http.get('/api/recipes/:slug/', () =>
        HttpResponse.json<Recipe>({
          ...shakshuka,
          ingredient_lines: [
            line(1, 'plain flour', { amount: 1, unit: 'cup', original_text: '1 cup plain flour' }),
            line(2, 'eggs', { amount: 2, original_text: '2 eggs' }),
            line(3, 'chives', { optional: true })
          ],
          steps: [{ id: 1, text: 'Heat the oven to 350°F.' }]
        })
      )
    );

    renderRoute('/recipes/shakshuka');

    const ingredients = await screen.findByRole('region', { name: 'Ingredients' });
    const amounts = () => itemsOf(within(ingredients).getByRole('list'));
    const steps = () => itemsOf(within(screen.getByRole('region', { name: 'Method' })).getByRole('list'));
    const showOriginal = () => within(ingredients).queryByRole('button', { name: 'Show original' });
    expect(amounts()).toEqual(['240 ml plain flour', '2 eggs', 'chives (optional)']);
    expect(steps()).toEqual(['Heat the oven to 175°C.']);
    expect(showOriginal()).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(within(ingredients).getByRole('button', { name: 'Show original' }));

    expect(showOriginal()).toHaveAttribute('aria-pressed', 'true');
    expect(amounts()).toEqual(['1 cup plain flour', '2 eggs', 'chives (optional)']);
    expect(steps()).toEqual(['Heat the oven to 350°F.']);

    // US customary reads the same as the original, so there's nothing different to show.
    await userEvent.click(screen.getByRole('radio', { name: 'US' }));

    expect(amounts()).toEqual(['1 cup plain flour', '2 eggs', 'chives (optional)']);
    expect(steps()).toEqual(['Heat the oven to 350°F.']);
    expect(showOriginal()).not.toBeInTheDocument();
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
