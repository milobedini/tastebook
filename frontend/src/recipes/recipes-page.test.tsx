import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';
import { filterParams } from './recipe-filters';

type Course = components['schemas']['Course'];
type Cuisine = components['schemas']['Cuisine'];
type IngredientOption = components['schemas']['IngredientOption'];
type Recipe = components['schemas']['RecipeSummary'];

const failRecipes = () => server.use(http.get('/api/recipes/', () => new HttpResponse(null, { status: 503 })));

const appleTart: Recipe = {
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
const bananaBread: Recipe = {
  id: 2,
  slug: 'banana-bread',
  title: 'Banana bread',
  description: '',
  cuisines: [],
  difficulty: 'easy',
  total_minutes: 75,
  photo: null,
  diet_tags: []
};

// Holds the next response from `path` until released, so the test can see the page while the request is in flight.
const hold = (path: string, respond: () => Response) => {
  const gate = { arrive: () => {}, release: () => {} };
  const requested = new Promise<void>((resolve) => {
    gate.arrive = resolve;
  });
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get(path, async () => {
      gate.arrive();
      await released;
      return respond();
    })
  );
  return { requested, release: () => gate.release() };
};

const holdRecipes = (respond: () => Response) => hold('/api/recipes/', respond);

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

const failCuisines = () => server.use(http.get('/api/cuisines/', () => new HttpResponse(null, { status: 503 })));

const holdCuisines = (respond: () => Response) => hold('/api/cuisines/', respond);

const failCourses = () => server.use(http.get('/api/courses/', () => new HttpResponse(null, { status: 503 })));

const holdCourses = (respond: () => Response) => hold('/api/courses/', respond);

const failIngredients = () => server.use(http.get('/api/ingredients/', () => new HttpResponse(null, { status: 503 })));

const holdIngredients = (respond: () => Response) => hold('/api/ingredients/', respond);

// Answers each list request from `results` by its sorted query string ('' for none) and records the ones it was asked for.
const answerFilters = (results: Record<string, Recipe[]>) => {
  const queries: string[] = [];
  server.use(
    http.get('/api/recipes/', ({ request }) => {
      const params = new URL(request.url).searchParams;
      params.sort();
      const query = params.toString();
      queries.push(query);
      return HttpResponse.json<Recipe[]>(results[query] ?? []);
    })
  );
  return queries;
};

// A sample value for every parameter the address can filter by, and the chips it shows under Filters on. Keyed by
// filterParams, so a new filter parameter doesn't type-check here until it has a chip, or an empty list saying why not.
const filterChips: Record<(typeof filterParams)[number], { values: string[]; chips: string[] }> = {
  cuisine: { values: ['french'], chips: ['French'] },
  course: { values: ['dessert'], chips: ['Dessert'] },
  difficulty: { values: ['easy'], chips: ['Easy'] },
  max_total: { values: ['30'], chips: ['Total up to 30 min'] },
  max_prep: { values: ['15'], chips: ['Prep up to 15 min'] },
  max_cook: { values: ['45'], chips: ['Cook up to 45 min'] },
  one_pot: { values: ['true'], chips: ['One-pot'] },
  diet: { values: ['vegan'], chips: ['Vegan'] },
  include_ingredient: { values: ['aubergine', 'peanuts'], chips: ['With aubergine', 'With peanuts'] },
  include_match: { values: ['all'], chips: ['With all of these'] },
  exclude_ingredient: { values: ['creme-fraiche'], chips: ['Without crème fraîche'] }
};

const headings = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

const searchBox = () => screen.getByRole('searchbox', { name: 'Search recipes' });

const filtersButton = () => screen.getByRole('button', { name: 'Filters' });

const filterGroup = (name: string) => screen.getByRole('group', { name });

const filtersOn = () =>
  within(screen.getByRole('list', { name: 'Filters on' }))
    .getAllByRole('button', { name: /^Remove filter: / })
    .map((chip) => chip.getAttribute('aria-label'));

const filterGroupNames = [
  'Total time',
  'Prep time',
  'Cook time',
  'Difficulty',
  'Course',
  'Cuisine',
  'One-pot',
  'Diet',
  'Ingredients'
];

const cuisines: Cuisine[] = [
  { slug: 'french', name: 'French' },
  { slug: 'italian', name: 'Italian' },
  { slug: 'japanese', name: 'Japanese' }
];

const courses: Course[] = [
  { slug: 'dessert', name: 'Dessert' },
  { slug: 'main', name: 'Main' }
];

const ingredients: IngredientOption[] = [
  { slug: 'aubergine', name: 'aubergine', synonyms: ['eggplant'] },
  { slug: 'creme-fraiche', name: 'crème fraîche', synonyms: [] },
  { slug: 'peanuts', name: 'peanuts', synonyms: ['groundnuts'] }
];

const openPickerInOpenPanel = async (name: string) => {
  const picker = await within(filterGroup('Ingredients')).findByRole('combobox', { name });
  await userEvent.click(picker);
  return picker;
};

const openPicker = async (name: string) => {
  await userEvent.click(filtersButton());
  return openPickerInOpenPanel(name);
};

const options = () => screen.getAllByRole('option').map((option) => option.textContent);

const recipeCount = () => screen.queryByText(/^\d+ recipes?$/)?.textContent;

describe('RecipesPage', () => {
  it('titles the tab "Recipes · Tastebook"', async () => {
    renderRoute('/recipes');

    await waitFor(() => expect(document.title).toBe('Recipes · Tastebook'));
  });

  it('shows a loading message, then the recipes in the order the API sends', async () => {
    const { release } = holdRecipes(() =>
      HttpResponse.json<Recipe[]>([
        {
          id: 7,
          slug: 'shakshuka',
          title: 'Shakshuka',
          description: 'Eggs in spiced tomatoes.',
          cuisines: [],
          difficulty: 'easy',
          total_minutes: 35,
          photo: null,
          diet_tags: []
        },
        {
          id: 3,
          slug: 'apple-tart',
          title: 'Apple tart',
          description: '',
          cuisines: [],
          difficulty: 'hard',
          total_minutes: 90,
          photo: null,
          diet_tags: []
        }
      ])
    );

    renderRoute('/recipes');

    expect((await screen.findByText('Finding recipes…')).closest('[aria-busy="true"]')).not.toBeNull();
    expect(recipeCount()).toBeUndefined();

    release();

    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(recipeCount()).toBe('2 recipes');
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Shakshuka',
      'Apple tart'
    ]);
    expect(screen.getByRole('heading', { name: 'Apple tart' }).closest('li')).toHaveTextContent(
      /^Apple tart1 hr 30 min · Hard$/
    );
    expect(screen.queryByText('Finding recipes…')).not.toBeInTheDocument();
    expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
  });

  it("shows only each recipe's total time, difficulty and cuisines under its card", async () => {
    server.use(
      http.get('/api/recipes/', () =>
        HttpResponse.json<Recipe[]>([
          { ...appleTart, diet_tags: ['vegetarian', 'gluten_free'] },
          {
            id: 4,
            slug: 'ramen-tacos',
            title: 'Ramen tacos',
            description: '',
            cuisines: [
              { slug: 'japanese', name: 'Japanese' },
              { slug: 'mexican', name: 'Mexican' }
            ],
            difficulty: 'easy',
            total_minutes: 25,
            photo: null,
            diet_tags: []
          }
        ])
      )
    );

    renderRoute('/recipes');

    expect((await screen.findByRole('heading', { name: 'Apple tart' })).closest('li')).toHaveTextContent(
      /^Apple tart1 hr 40 min · Medium · French$/
    );
    expect(screen.getByRole('heading', { name: 'Ramen tacos' }).closest('li')).toHaveTextContent(
      /^Ramen tacos25 min · Easy · Japanese, Mexican$/
    );
  });

  it("loads the first row's photos at once and the rest lazily, at the card width, and shows none on a card without one", async () => {
    const photoOf = (name: string) => ({
      thumbnails: [330, 500].map((width) => ({
        width,
        url: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/${name}.jpg/${width}px-${name}.jpg`
      })),
      author: 'Jane Doe',
      licence: 'CC BY-SA 4.0',
      source_url: `https://commons.wikimedia.org/wiki/File:${name}.jpg`
    });
    server.use(
      http.get('/api/recipes/', () =>
        HttpResponse.json<Recipe[]>([
          { ...appleTart, photo: photoOf('Tart') },
          bananaBread,
          { ...appleTart, id: 3, slug: 'carrot-cake', title: 'Carrot cake', photo: photoOf('Cake') }
        ])
      )
    );

    renderRoute('/recipes');

    const cards = (await screen.findAllByRole('listitem')).map((card) => [
      within(card).getByRole('heading').textContent,
      within(card)
        .queryAllByRole('presentation')
        .map((image) => [
          image.getAttribute('srcset'),
          image.getAttribute('sizes'),
          image.getAttribute('loading'),
          image.getAttribute('fetchpriority')
        ])
    ]);
    const cardSizes = '(width < 17.5em) calc(100vw - 3rem), (min-width: 42rem) 18.5rem, calc(50vw - 2.5rem)';
    expect(cards).toEqual([
      [
        'Apple tart',
        [
          [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tart.jpg/330px-Tart.jpg 330w, ' +
              'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tart.jpg/500px-Tart.jpg 500w',
            cardSizes,
            'eager',
            'high'
          ]
        ]
      ],
      ['Banana bread', []],
      [
        'Carrot cake',
        [
          [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Cake.jpg/330px-Cake.jpg 330w, ' +
              'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Cake.jpg/500px-Cake.jpg 500w',
            cardSizes,
            'lazy',
            'auto'
          ]
        ]
      ]
    ]);
  });

  it("names each card's link by the recipe and describes it by its meta", async () => {
    renderRoute('/recipes');

    const link = await screen.findByRole('link', { name: 'Apple tart' });

    expect(link).toHaveAccessibleDescription('1 hr 40 min · Medium · French');
    expect(link).toHaveAttribute('href', '/recipes/apple-tart');
  });

  it.each([
    [1, 'rug'],
    [2, 'place-setting'],
    [4, 'place-setting']
  ])('draws the place setting or the rug for a recipe without a photo, by its ID (%i: %s)', async (id, filler) => {
    server.use(http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>([{ ...appleTart, id }])));

    renderRoute('/recipes');

    const card = (await screen.findByRole('heading', { name: 'Apple tart' })).closest('li');
    expect(card?.querySelector('[data-filler]')).toHaveAttribute('data-filler', filler);
  });

  it.each([
    ['/recipes', 'No recipes yet.', "Recipes show here once they're in the catalogue.", 'No recipes match “xyzzy”.'],
    [
      '/recipes?q=xyzzy',
      'No recipes match “xyzzy”.',
      'Nothing in the catalogue mentions it. Try another word.',
      'No recipes yet.'
    ]
  ])('at %s, says %s and why when there are no recipes', async (path, shown, why, absent) => {
    server.use(http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>([])));

    renderRoute(path);

    expect(await screen.findByText(shown)).toBeInTheDocument();
    expect(screen.getByText(why)).toBeInTheDocument();
    expect(screen.queryByText(absent)).not.toBeInTheDocument();
    expect(screen.queryByText('one fewer?')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 recipes');
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

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load recipes");
    expect(alert).toHaveTextContent('Check your connection, then try again.');
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
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

  it('clears the search with its clear button', async () => {
    answerSearches({ tart: [appleTart], '': [appleTart, bananaBread] });
    const { router } = renderRoute('/recipes?q=tart');

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveFocus();
    expect(router.state.location.search).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('keeps the previous results while a search loads', async () => {
    renderRoute('/recipes');
    await screen.findByText('Banana bread');
    const search = holdRecipes(() => HttpResponse.json<Recipe[]>([appleTart]));

    await userEvent.type(searchBox(), 'tart');
    await search.requested;

    expect(headings()).toEqual(['Apple tart', 'Banana bread']);
    expect(screen.queryByText('Finding recipes…')).not.toBeInTheDocument();

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
        {
          id: 7,
          slug: 'shakshuka',
          title: 'Shakshuka',
          description: 'Eggs in spiced tomatoes.',
          cuisines: [],
          difficulty: 'easy',
          total_minutes: 35,
          photo: null,
          diet_tags: []
        }
      ])
    );
    await userEvent.click(tryAgain);

    expect(await screen.findByRole('button', { name: 'Trying…' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load recipes");
    expect(screen.queryByText('Finding recipes…')).not.toBeInTheDocument();

    release();

    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('brings the alert back when the retry fails again', async () => {
    failRecipes();
    renderRoute('/recipes');
    const tryAgain = await screen.findByRole('button', { name: 'Try again' });

    const { release } = holdRecipes(() => new HttpResponse(null, { status: 503 }));
    await userEvent.click(tryAgain);

    expect(await screen.findByRole('button', { name: 'Trying…' })).toBeInTheDocument();

    release();

    expect(await screen.findByRole('button', { name: 'Try again' })).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load recipes");
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

  it('keeps the cuisine while typing a search', async () => {
    const queries = answerFilters({ 'cuisine=french': [appleTart], 'cuisine=french&q=tart': [appleTart] });
    const { router } = renderRoute('/recipes?cuisine=french');
    await screen.findByText('Apple tart');

    await userEvent.type(searchBox(), 'tart');

    expect(router.state.location.search).toBe('?cuisine=french&q=tart');
    await waitFor(() => expect(queries.at(-1)).toBe('cuisine=french&q=tart'));
  });

  it('opens and closes the filters from the Filters button', async () => {
    renderRoute('/recipes');
    expect(filtersButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();

    await userEvent.click(filtersButton());

    expect(filtersButton()).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(filtersButton().getAttribute('aria-controls') ?? '');
    expect(
      within(panel ?? document.createElement('div'))
        .getAllByRole('group')
        .map((group) => group.querySelector('legend')?.textContent)
    ).toEqual(filterGroupNames);

    await userEvent.click(filtersButton());

    expect(filtersButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it.each([
    ['Total time', 'Up to 30 min', 'max_total=30'],
    ['Prep time', 'Up to 15 min', 'max_prep=15'],
    ['Cook time', 'Up to 60 min', 'max_cook=60'],
    ['Difficulty', 'Easy', 'difficulty=easy'],
    ['Course', 'Dessert', 'course=dessert'],
    ['Cuisine', 'Italian', 'cuisine=italian'],
    ['One-pot', 'One-pot only', 'one_pot=true'],
    ['Diet', 'Vegan', 'diet=vegan']
  ])('in %s, "%s" filters by %s', async (group, name, query) => {
    const queries = answerFilters({});
    const { router } = renderRoute('/recipes');
    await userEvent.click(filtersButton());

    const chip = await within(filterGroup(group)).findByRole('button', { name });
    await userEvent.click(chip);

    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(router.state.location.search).toBe(`?${query}`);
    await waitFor(() => expect(queries.at(-1)).toBe(query));
  });

  it('combines two cuisines in one request', async () => {
    const queries = answerFilters({});
    const { router } = renderRoute('/recipes');
    await userEvent.click(filtersButton());

    await userEvent.click(await within(filterGroup('Cuisine')).findByRole('button', { name: 'Italian' }));
    await userEvent.click(within(filterGroup('Cuisine')).getByRole('button', { name: 'Japanese' }));

    expect(router.state.location.search).toBe('?cuisine=italian&cuisine=japanese');
    await waitFor(() => expect(queries.at(-1)).toBe('cuisine=italian&cuisine=japanese'));
  });

  it('a second time limit replaces the first', async () => {
    const { router } = renderRoute('/recipes');
    await userEvent.click(filtersButton());
    const totalTime = within(filterGroup('Total time'));

    await userEvent.click(totalTime.getByRole('button', { name: 'Up to 15 min' }));
    await userEvent.click(totalTime.getByRole('button', { name: 'Up to 45 min' }));

    expect(router.state.location.search).toBe('?max_total=45');
    expect(totalTime.getByRole('button', { name: 'Up to 15 min' })).toHaveAttribute('aria-pressed', 'false');
    expect(totalTime.getByRole('button', { name: 'Up to 45 min' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pressing a pressed chip turns it off', async () => {
    const queries = answerFilters({ 'difficulty=easy': [bananaBread], '': [appleTart, bananaBread] });
    const { router } = renderRoute('/recipes?difficulty=easy');
    await userEvent.click(filtersButton());
    const easy = within(filterGroup('Difficulty')).getByRole('button', { name: 'Easy' });
    expect(easy).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(easy);

    expect(router.state.location.search).toBe('');
    expect(easy).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(queries.at(-1)).toBe(''));
  });

  it('opens the search and filters from the address', async () => {
    const queries = answerFilters({ 'cuisine=french&cuisine=japanese&max_total=30&one_pot=true&q=tart': [appleTart] });

    renderRoute('/recipes?q=tart&cuisine=french&cuisine=japanese&max_total=30&one_pot=true');

    expect(searchBox()).toHaveValue('tart');
    await waitFor(() =>
      expect(filtersOn()).toEqual([
        'Remove filter: Total up to 30 min',
        'Remove filter: French',
        'Remove filter: Japanese',
        'Remove filter: One-pot'
      ])
    );
    await waitFor(() => expect(headings()).toEqual(['Apple tart']));
    expect(queries).toEqual(['cuisine=french&cuisine=japanese&max_total=30&one_pot=true&q=tart']);
  });

  it('shows a chip for every filter parameter that changes the request', async () => {
    const queries = answerFilters({});
    const address = new URLSearchParams(
      Object.entries(filterChips).flatMap(([param, { values }]) => values.map((value) => [param, value]))
    );

    renderRoute(`/recipes?${address}`);

    await waitFor(() =>
      expect(filtersOn().toSorted()).toEqual(
        Object.values(filterChips)
          .flatMap(({ chips }) => chips.map((chip) => `Remove filter: ${chip}`))
          .toSorted()
      )
    );
    const requested = new URLSearchParams(queries.at(-1));
    expect([...new Set(requested.keys())].toSorted()).toEqual(filterParams.toSorted());
  });

  it('removes one filter from its chip', async () => {
    const { router } = renderRoute('/recipes?q=tart&cuisine=french&cuisine=japanese&max_total=30&one_pot=true');

    await userEvent.click(await screen.findByRole('button', { name: 'Remove filter: French' }));

    expect(router.state.location.search).toBe('?q=tart&cuisine=japanese&max_total=30&one_pot=true');
    expect(filtersOn()).toEqual([
      'Remove filter: Total up to 30 min',
      'Remove filter: Japanese',
      'Remove filter: One-pot'
    ]);
    expect(filtersButton()).toHaveFocus();
  });

  it('Clear filters keeps the search', async () => {
    answerFilters({ 'cuisine=french&difficulty=easy&q=tart': [appleTart], 'q=tart': [appleTart] });
    const { router } = renderRoute('/recipes?q=tart&cuisine=french&difficulty=easy');
    await waitFor(() => expect(headings()).toEqual(['Apple tart']));

    await userEvent.click(
      within(screen.getByRole('list', { name: 'Filters on' })).getByRole('button', { name: 'Clear filters' })
    );

    expect(router.state.location.search).toBe('?q=tart');
    expect(screen.queryByRole('list', { name: 'Filters on' })).not.toBeInTheDocument();
    expect(searchBox()).toHaveValue('tart');
    expect(filtersButton()).toHaveFocus();
  });

  it('names only cuisines it knows', async () => {
    const queries = answerFilters({});

    renderRoute('/recipes?cuisine=klingon&cuisine=italian');

    await waitFor(() => expect(filtersOn()).toEqual(['Remove filter: Italian']));
    expect(queries).toEqual(['cuisine=klingon&cuisine=italian']);
  });

  it('shows the slug on a chip while the cuisines load', async () => {
    const { requested, release } = holdCuisines(() => HttpResponse.json<Cuisine[]>(cuisines));
    renderRoute('/recipes?cuisine=italian');
    await requested;

    expect(filtersOn()).toEqual(['Remove filter: italian']);

    release();

    await waitFor(() => expect(filtersOn()).toEqual(['Remove filter: Italian']));
  });

  it('shows no filters on once the only cuisine turns out to be unknown', async () => {
    const { requested, release } = holdCuisines(() => HttpResponse.json<Cuisine[]>(cuisines));
    renderRoute('/recipes?cuisine=klingon');
    await requested;

    expect(filtersOn()).toEqual(['Remove filter: klingon']);

    release();

    await waitFor(() => expect(screen.queryByRole('list', { name: 'Filters on' })).not.toBeInTheDocument());
  });

  it.each([
    ['/recipes?cuisine=italian', 'No recipes match these filters.', ''],
    ['/recipes?q=tart&cuisine=italian', 'No recipes match “tart” with these filters.', '?q=tart']
  ])('at %s, says %s and clears the filters from there', async (path, title, cleared) => {
    server.use(http.get('/api/recipes/', () => HttpResponse.json<Recipe[]>([])));
    const { router } = renderRoute(path);

    const emptyState = (await screen.findByRole('heading', { name: title })).parentElement;
    expect(screen.queryByText('No recipes yet.')).not.toBeInTheDocument();
    expect(screen.getByText('Nothing in the catalogue has all of them. Try removing a filter.')).toBeInTheDocument();
    expect(screen.getByText('one fewer?').closest('[aria-hidden="true"]')).not.toBeNull();
    await userEvent.click(within(emptyState ?? document.body).getByRole('button', { name: 'Clear filters' }));

    expect(router.state.location.search).toBe(cleared);
    expect(filtersButton()).toHaveFocus();
  });

  it('says how many recipes match', async () => {
    answerFilters({ 'difficulty=easy': [bananaBread] });

    renderRoute('/recipes?difficulty=easy');

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 recipe'));
    expect(headings()).toEqual(['Banana bread']);
  });

  it.each([
    ['cuisines', failCuisines, 'Cuisine', 'Load cuisines again', 'button', ['French', 'Italian', 'Japanese']],
    ['courses', failCourses, 'Course', 'Load courses again', 'button', ['Dessert', 'Main']],
    [
      'ingredients',
      failIngredients,
      'Ingredients',
      'Load ingredients again',
      'combobox',
      ['Include an ingredient', 'Exclude an ingredient']
    ]
  ] as const)(
    'keeps the list when the %s fail, and loads them again on request',
    async (noun, fail, group, retry, role, names) => {
      fail();
      renderRoute('/recipes');
      await userEvent.click(filtersButton());

      expect(await within(filterGroup(group)).findByRole('alert')).toHaveTextContent(`The ${noun} couldn't be loaded.`);
      await waitFor(() => expect(headings()).toEqual(['Apple tart', 'Banana bread']));

      server.resetHandlers();
      await userEvent.click(screen.getByRole('button', { name: retry }));

      await waitFor(() => expect(within(filterGroup(group)).getAllByRole(role)).toHaveLength(names.length));
      within(filterGroup(group))
        .getAllByRole(role)
        .map((control, index) => expect(control).toHaveAccessibleName(names[index]));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );

  it.each([
    ['Cuisine', 'Loading cuisines…', () => holdCuisines(() => HttpResponse.json<Cuisine[]>(cuisines)), 'button', 3],
    ['Course', 'Loading courses…', () => holdCourses(() => HttpResponse.json<Course[]>(courses)), 'button', 2],
    [
      'Ingredients',
      'Loading ingredients…',
      () => holdIngredients(() => HttpResponse.json<IngredientOption[]>(ingredients)),
      'combobox',
      2
    ]
  ] as const)('in %s, says %s, then shows its controls', async (group, loading, holdList, role, count) => {
    const { requested, release } = holdList();
    renderRoute('/recipes');
    await requested;
    await userEvent.click(filtersButton());

    expect(within(filterGroup(group)).getByText(loading)).toBeInTheDocument();

    release();

    await waitFor(() => expect(within(filterGroup(group)).getAllByRole(role)).toHaveLength(count));
    expect(within(filterGroup(group)).queryByText(loading)).not.toBeInTheDocument();
  });

  it('needs every diet picked', async () => {
    const queries = answerFilters({});
    const { router } = renderRoute('/recipes');
    await userEvent.click(filtersButton());

    await userEvent.click(within(filterGroup('Diet')).getByRole('button', { name: 'Vegan' }));
    await userEvent.click(within(filterGroup('Diet')).getByRole('button', { name: 'Gluten-free' }));

    expect(router.state.location.search).toBe('?diet=vegan&diet=gluten_free');
    await waitFor(() => expect(queries.at(-1)).toBe('diet=vegan&diet=gluten_free'));
    expect(filtersOn()).toEqual(['Remove filter: Vegan', 'Remove filter: Gluten-free']);
  });

  it('includes an ingredient found by a synonym', async () => {
    const queries = answerFilters({});
    const { router } = renderRoute('/recipes');
    const search = await openPicker('Include an ingredient');

    await userEvent.type(search, 'eggpl');

    expect(options()).toEqual(['aubergine · also eggplant']);

    await userEvent.click(screen.getByRole('option', { name: 'aubergine · also eggplant' }));

    expect(router.state.location.search).toBe('?include_ingredient=aubergine');
    await waitFor(() => expect(queries.at(-1)).toBe('include_ingredient=aubergine'));
    expect(filtersOn()).toEqual(['Remove filter: With aubergine']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(search).toHaveFocus();
    expect(
      within(filterGroup('Ingredients')).getByRole('button', { name: 'Remove ingredient: aubergine' })
    ).toBeInTheDocument();
  });

  it('lists recipes with all the included ingredients once asked', async () => {
    const queries = answerFilters({
      'include_ingredient=aubergine&include_ingredient=peanuts': [appleTart, bananaBread],
      'include_ingredient=aubergine&include_ingredient=peanuts&include_match=all': [bananaBread]
    });
    const { router } = renderRoute('/recipes?include_ingredient=aubergine&include_ingredient=peanuts');
    await waitFor(() => expect(headings()).toEqual(['Apple tart', 'Banana bread']));
    await userEvent.click(filtersButton());
    const includeMatch = filterGroup('Included ingredients');
    expect(within(includeMatch).getByRole('radio', { name: 'With any' })).toBeChecked();

    await userEvent.click(within(includeMatch).getByRole('radio', { name: 'With all' }));

    expect(router.state.location.search).toBe(
      '?include_ingredient=aubergine&include_ingredient=peanuts&include_match=all'
    );
    await waitFor(() => expect(headings()).toEqual(['Banana bread']));
    expect(queries.at(-1)).toBe('include_ingredient=aubergine&include_ingredient=peanuts&include_match=all');
    expect(within(includeMatch).getByRole('radio', { name: 'With all' })).toBeChecked();
    expect(filtersOn()).toEqual([
      'Remove filter: With aubergine',
      'Remove filter: With peanuts',
      'Remove filter: With all of these'
    ]);

    await userEvent.click(within(includeMatch).getByRole('radio', { name: 'With any' }));

    expect(router.state.location.search).toBe('?include_ingredient=aubergine&include_ingredient=peanuts');
    await waitFor(() => expect(headings()).toEqual(['Apple tart', 'Banana bread']));
  });

  it('goes back to any of the included ingredients when the With all of these chip is removed', async () => {
    const queries = answerFilters({
      'include_ingredient=aubergine&include_ingredient=peanuts': [appleTart, bananaBread],
      'include_ingredient=aubergine&include_ingredient=peanuts&include_match=all': [bananaBread]
    });
    const { router } = renderRoute(
      '/recipes?include_ingredient=aubergine&include_ingredient=peanuts&include_match=all'
    );
    await waitFor(() => expect(headings()).toEqual(['Banana bread']));

    await userEvent.click(await screen.findByRole('button', { name: 'Remove filter: With all of these' }));

    expect(router.state.location.search).toBe('?include_ingredient=aubergine&include_ingredient=peanuts');
    await waitFor(() => expect(headings()).toEqual(['Apple tart', 'Banana bread']));
    expect(queries.at(-1)).toBe('include_ingredient=aubergine&include_ingredient=peanuts');
    expect(filtersOn()).toEqual(['Remove filter: With aubergine', 'Remove filter: With peanuts']);
  });

  it('offers the any or all choice only once two ingredients are included', async () => {
    const queries = answerFilters({});
    renderRoute('/recipes?include_ingredient=aubergine&include_match=all');
    await userEvent.click(filtersButton());
    await within(filterGroup('Ingredients')).findByRole('combobox', { name: 'Include an ingredient' });

    expect(screen.queryByRole('group', { name: 'Included ingredients' })).not.toBeInTheDocument();
    expect(queries).toEqual(['include_ingredient=aubergine']);
    expect(filtersOn()).toEqual(['Remove filter: With aubergine']);

    const search = await openPickerInOpenPanel('Include an ingredient');
    await userEvent.type(search, 'peanuts');
    await userEvent.click(screen.getByRole('option', { name: 'peanuts · also groundnuts' }));

    const includeMatch = filterGroup('Included ingredients');
    expect(within(includeMatch).getByRole('radio', { name: 'With all' })).toBeChecked();
    await waitFor(() =>
      expect(queries.at(-1)).toBe('include_ingredient=aubergine&include_ingredient=peanuts&include_match=all')
    );
    expect(filtersOn()).toEqual([
      'Remove filter: With aubergine',
      'Remove filter: With peanuts',
      'Remove filter: With all of these'
    ]);
  });

  it('clears the any or all choice with the other filters', async () => {
    const { router } = renderRoute(
      '/recipes?q=tart&include_ingredient=aubergine&include_ingredient=peanuts&include_match=all'
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(router.state.location.search).toBe('?q=tart');
  });

  it('finds an ingredient ignoring accents', async () => {
    renderRoute('/recipes');
    const search = await openPicker('Exclude an ingredient');

    await userEvent.type(search, 'creme');

    expect(options()).toEqual(['crème fraîche']);
  });

  it('offers an ingredient picked in one list nowhere else', async () => {
    const { router } = renderRoute('/recipes');
    const search = await openPicker('Exclude an ingredient');
    await userEvent.type(search, 'peanuts');
    await userEvent.click(screen.getByRole('option', { name: 'peanuts · also groundnuts' }));

    await userEvent.click(within(filterGroup('Ingredients')).getByRole('combobox', { name: 'Include an ingredient' }));

    expect(router.state.location.search).toBe('?exclude_ingredient=peanuts');
    expect(filtersOn()).toEqual(['Remove filter: Without peanuts']);
    expect(options()).toEqual(['aubergine · also eggplant', 'crème fraîche']);
  });

  it('says when no ingredient matches', async () => {
    renderRoute('/recipes');
    const search = await openPicker('Include an ingredient');
    expect(options()).toHaveLength(3);

    await userEvent.type(search, 'kale');

    expect(
      within(filterGroup('Ingredients'))
        .getAllByRole('status')
        .map((status) => status.textContent)
    ).toEqual(['No ingredients match.', '']);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(search).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the list with Escape, then clears the text', async () => {
    const { router } = renderRoute('/recipes');
    const search = await openPicker('Exclude an ingredient');
    await userEvent.type(search, 'aub');
    expect(screen.getByRole('listbox', { name: 'Exclude an ingredient' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(search).toHaveValue('aub');
    expect(router.state.location.search).toBe('');

    await userEvent.keyboard('{Escape}');

    expect(search).toHaveValue('');
  });

  it('opens diet and ingredient filters from the address', async () => {
    const queries = answerFilters({});

    renderRoute(
      '/recipes?diet=vegan&include_ingredient=aubergine&exclude_ingredient=peanuts&exclude_ingredient=klingon'
    );

    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Filters on' }))
          .getAllByRole('button')
          .map((button) => button.getAttribute('aria-label') ?? button.textContent)
      ).toEqual([
        'Remove filter: Vegan',
        'Remove filter: With aubergine',
        'Remove filter: Without peanuts',
        'Clear filters'
      ])
    );
    expect(queries).toEqual([
      'diet=vegan&exclude_ingredient=peanuts&exclude_ingredient=klingon&include_ingredient=aubergine'
    ]);
  });

  it('removes an included ingredient from the chip above its field', async () => {
    const { router } = renderRoute('/recipes?include_ingredient=aubergine');
    await userEvent.click(filtersButton());

    await userEvent.click(
      await within(filterGroup('Ingredients')).findByRole('button', { name: 'Remove ingredient: aubergine' })
    );

    expect(router.state.location.search).toBe('');
    expect(within(filterGroup('Ingredients')).getByRole('combobox', { name: 'Include an ingredient' })).toHaveFocus();
  });

  it('removes an excluded ingredient from its chip', async () => {
    const queries = answerFilters({});
    const { router } = renderRoute('/recipes?diet=vegan&exclude_ingredient=peanuts');

    await userEvent.click(
      await within(await screen.findByRole('list', { name: 'Filters on' })).findByRole('button', {
        name: 'Remove filter: Without peanuts'
      })
    );

    expect(router.state.location.search).toBe('?diet=vegan');
    await waitFor(() => expect(queries.at(-1)).toBe('diet=vegan'));
  });

  it('shows the slug on an ingredient chip while the ingredients load', async () => {
    const { requested, release } = holdIngredients(() => HttpResponse.json<IngredientOption[]>(ingredients));
    renderRoute('/recipes?exclude_ingredient=creme-fraiche');
    await requested;

    expect(filtersOn()).toEqual(['Remove filter: Without creme-fraiche']);

    release();

    await waitFor(() => expect(filtersOn()).toEqual(['Remove filter: Without crème fraîche']));
  });
});
