from decimal import Decimal
from typing import Any

import pytest
from django.test import Client
from django.urls import reverse
from pytest_django import DjangoAssertNumQueries
from rest_framework.test import APIClient

from recipes.models import (
    Course,
    Cuisine,
    Equipment,
    Ingredient,
    IngredientGroup,
    IngredientLine,
    IngredientSynonym,
    Recipe,
    Step,
)

# A valid recipe's details, for tests about something else.
DETAILS: dict[str, Any] = {
    'difficulty': 'easy',
    'prep_minutes': 10,
    'cook_minutes': 20,
    'servings': 4,
    'source': 'Tastebook',
}


def make_recipe(**fields: Any) -> Recipe:
    return Recipe.objects.create(**{**DETAILS, **fields})


INLINES = ['ingredient_groups', 'ingredient_lines', 'steps']


# The management form of each inline on the recipe admin page, with the rows it posts and the rows it already had.
def inline_forms(prefix: str, rows: list[dict[str, Any]], initial: int = 0) -> dict[str, Any]:
    fields = {f'{prefix}-{index}-{name}': value for index, row in enumerate(rows) for name, value in row.items()}
    return {
        f'{prefix}-TOTAL_FORMS': len(rows),
        f'{prefix}-INITIAL_FORMS': initial,
        f'{prefix}-MIN_NUM_FORMS': 0,
        f'{prefix}-MAX_NUM_FORMS': 1000,
        **fields,
    }


def no_inlines() -> dict[str, Any]:
    return {key: value for prefix in INLINES for key, value in inline_forms(prefix, []).items()}


def ingredient(name: str) -> Ingredient:
    return Ingredient.objects.get_or_create(name=name, defaults={'slug': name.replace(' ', '-')})[0]


def add_line(recipe: Recipe, name: str, **fields: Any) -> IngredientLine:
    return IngredientLine.objects.create(recipe=recipe, ingredient=ingredient(name), **fields)


# The admin form's version of DETAILS: every field it posts, with one course and no ingredients or steps.
def admin_details() -> dict[str, Any]:
    return {
        **DETAILS,
        **no_inlines(),
        'extra_minutes': 0,
        'extra_label': '',
        'yield_amount': '',
        'yield_unit': '',
        'courses': [Course.objects.get(slug='main').id],
    }


@pytest.mark.django_db
def test_lists_recipes_alphabetically_ignoring_case_oldest_first_on_a_tie() -> None:
    for title, description in [
        ('Shakshuka', 'Eggs in spiced tomatoes.'),
        ('banana bread', ''),
        ('Apple tart', 'Sharp apples.'),
        ('Shakshuka', 'Green version.'),
        ('apple pie', ''),
    ]:
        make_recipe(title=title, description=description)

    response = APIClient().get(reverse('recipe-list'))

    assert response.status_code == 200
    assert [(recipe['title'], recipe['description']) for recipe in response.json()] == [
        ('apple pie', ''),
        ('Apple tart', 'Sharp apples.'),
        ('banana bread', ''),
        ('Shakshuka', 'Eggs in spiced tomatoes.'),
        ('Shakshuka', 'Green version.'),
    ]


@pytest.mark.django_db
def test_returns_a_summary_of_each_recipe_with_its_total_time_and_difficulty() -> None:
    recipe = make_recipe(
        title='Shakshuka',
        description='Eggs in spiced tomatoes.',
        difficulty='medium',
        prep_minutes=10,
        cook_minutes=25,
        extra_minutes=5,
        extra_label='resting',
        one_pot=True,
    )

    response = APIClient().get(reverse('recipe-list'))

    assert response.json() == [
        {
            'id': recipe.id,
            'slug': 'shakshuka',
            'title': 'Shakshuka',
            'description': 'Eggs in spiced tomatoes.',
            'cuisines': [],
            'difficulty': 'medium',
            'total_minutes': 40,
            'photo': None,
            'diet_tags': [],
        }
    ]


@pytest.mark.django_db
def test_returns_an_empty_list_with_no_recipes() -> None:
    response = APIClient().get(reverse('recipe-list'))

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_a_staff_user_adds_a_recipe_in_the_admin(admin_client: Client) -> None:
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {**admin_details(), 'title': 'Shakshuka', 'description': '', 'cuisines': [italian.id]},
    )

    assert response.status_code == 302
    assert list(Recipe.objects.values_list('title', 'description')) == [('Shakshuka', '')]


@pytest.mark.django_db
def test_a_staff_user_edits_a_recipe_in_the_admin(admin_client: Client) -> None:
    recipe = make_recipe(title='Shakshuka', description='Eggs in spiced tomatoes.')
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {**admin_details(), 'title': 'Green shakshuka', 'description': 'With spinach.', 'cuisines': [italian.id]},
    )

    assert response.status_code == 302
    recipe.refresh_from_db()
    assert (recipe.title, recipe.description) == ('Green shakshuka', 'With spinach.')


@pytest.mark.django_db
def test_the_admin_refuses_a_recipe_with_no_title(admin_client: Client) -> None:
    response = admin_client.post(
        reverse('admin:recipes_recipe_add'), {**admin_details(), 'title': '', 'description': 'No name.'}
    )

    assert response.status_code == 200
    assert Recipe.objects.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('title', 'slug'),
    [
        ('Apple tart', 'apple-tart'),
        ('Crème brûlée', 'creme-brulee'),
        ('  Eggs & soldiers!  ', 'eggs-soldiers'),
        ('!!!', 'recipe'),
    ],
)
def test_makes_a_slug_from_the_title(title: str, slug: str) -> None:
    recipe = make_recipe(title=title)

    assert recipe.slug == slug


@pytest.mark.django_db
def test_numbers_clashing_slugs_from_2_skipping_one_already_taken() -> None:
    for title in ['Shakshuka 2', 'Shakshuka', 'Shakshuka', 'Shakshuka']:
        make_recipe(title=title)

    assert list(Recipe.objects.order_by('id').values_list('slug', flat=True)) == [
        'shakshuka-2',
        'shakshuka',
        'shakshuka-3',
        'shakshuka-4',
    ]


@pytest.mark.django_db
def test_a_recipe_added_in_the_admin_gets_a_slug_from_its_title(admin_client: Client) -> None:
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {**admin_details(), 'title': 'Apple tart', 'description': '', 'cuisines': [italian.id]},
    )

    assert response.status_code == 302
    assert list(Recipe.objects.values_list('slug', flat=True)) == ['apple-tart']


@pytest.mark.django_db
def test_renaming_a_recipe_in_the_admin_keeps_its_slug(admin_client: Client) -> None:
    recipe = make_recipe(title='Shakshuka')
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {**admin_details(), 'title': 'Green shakshuka', 'description': '', 'cuisines': [italian.id]},
    )

    assert response.status_code == 302
    recipe.refresh_from_db()
    assert (recipe.title, recipe.slug) == ('Green shakshuka', 'shakshuka')


@pytest.mark.django_db
@pytest.mark.parametrize(('slug', 'status_code'), [('shakshuka', 200), ('apple-tart', 404)])
def test_returns_a_recipe_by_its_slug_or_404_for_an_unknown_one(slug: str, status_code: int) -> None:
    make_recipe(title='Shakshuka', description='Eggs in spiced tomatoes.')

    response = APIClient().get(reverse('recipe-detail', args=[slug]))

    assert response.status_code == status_code


@pytest.mark.django_db
def test_returns_the_whole_recipe_with_its_details() -> None:
    recipe = make_recipe(
        title='Shakshuka',
        description='Eggs in spiced tomatoes.',
        difficulty='medium',
        prep_minutes=10,
        cook_minutes=25,
        extra_minutes=5,
        extra_label='resting',
        servings=2,
        one_pot=True,
        source='Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)',
    )
    recipe.cuisines.add(Cuisine.objects.get(slug='italian'))
    recipe.courses.set(Course.objects.filter(slug__in=['main', 'breakfast']))
    recipe.equipment.set(Equipment.objects.filter(slug__in=['oven', 'hob']))

    response = APIClient().get(reverse('recipe-detail', args=['shakshuka']))

    assert response.json() == {
        'id': recipe.id,
        'slug': 'shakshuka',
        'title': 'Shakshuka',
        'description': 'Eggs in spiced tomatoes.',
        'cuisines': [{'slug': 'italian', 'name': 'Italian'}],
        'difficulty': 'medium',
        'total_minutes': 40,
        'photo': None,
        'diet_tags': [],
        'courses': [{'slug': 'breakfast', 'name': 'Breakfast'}, {'slug': 'main', 'name': 'Main'}],
        'prep_minutes': 10,
        'cook_minutes': 25,
        'extra_minutes': 5,
        'extra_label': 'resting',
        'servings': 2,
        'yield_amount': None,
        'yield_unit': '',
        'equipment': [{'slug': 'hob', 'name': 'Hob'}, {'slug': 'oven', 'name': 'Oven'}],
        'one_pot': True,
        'source': 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0)',
        'ingredient_lines': [],
        'ingredient_groups': [],
        'steps': [],
        'diet_tag_conflicts': [],
    }


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('q', 'titles'),
    [
        ('tart', ['Apple tart', 'Tarte Tatin']),
        ('TART', ['Apple tart', 'Tarte Tatin']),
        ('creme', ['Crème brûlée']),
        ('CRÈME', ['Crème brûlée']),
        ('brulee', ['Crème brûlée']),
        ('  bread  ', ['Banana bread']),
        ('pie', []),
        ('%', []),
        ('_', []),
        ('', ['Apple tart', 'Banana bread', 'Crème brûlée', 'Tarte Tatin']),
    ],
)
def test_searches_titles_anywhere_ignoring_case_accents_and_surrounding_spaces(q: str, titles: list[str]) -> None:
    for title in ['Tarte Tatin', 'Crème brûlée', 'Banana bread', 'Apple tart']:
        make_recipe(title=title)

    response = APIClient().get(reverse('recipe-list'), {'q': q})

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == titles


def make_searchable_recipes() -> None:
    IngredientSynonym.objects.create(ingredient=ingredient('aubergine'), name='eggplant')
    IngredientSynonym.objects.create(ingredient=ingredient('courgette'), name='zucchini')
    make_recipe(title='Stuffed aubergines')
    make_recipe(title='Baba ganoush', description='A smoky aubergine dip.')
    moussaka = make_recipe(title='Moussaka', description='Baked layers of aubergine and lamb.')
    add_line(moussaka, 'aubergine', note='sliced')
    add_line(moussaka, 'aubergine', note='diced', optional=True)
    add_line(moussaka, 'crème fraîche')
    ratatouille = make_recipe(title='Ratatouille')
    add_line(ratatouille, 'courgette')
    ratatouille.cuisines.set(Cuisine.objects.filter(slug='french'))
    make_recipe(title='Pad thai').cuisines.set(Cuisine.objects.filter(slug='thai'))
    make_recipe(title='Green curry').cuisines.set(Cuisine.objects.filter(slug='thai'))


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('q', 'titles'),
    [
        ('eggplant', ['Moussaka']),
        ('EGGPLANT', ['Moussaka']),
        ('courgette', ['Ratatouille']),
        (' Zucchini ', ['Ratatouille']),
        ('smoky', ['Baba ganoush']),
        ('creme fraiche', ['Moussaka']),
        ('french', ['Ratatouille']),
        ('aubergine', ['Stuffed aubergines', 'Baba ganoush', 'Moussaka']),
        ('thai', ['Pad thai', 'Green curry']),
        ('kale', []),
    ],
)
def test_searches_descriptions_ingredients_their_synonyms_and_cuisines_with_title_matches_first(
    q: str, titles: list[str]
) -> None:
    make_searchable_recipes()

    response = APIClient().get(reverse('recipe-list'), {'q': q})

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == titles


@pytest.mark.django_db
def test_searches_in_three_queries(django_assert_num_queries: DjangoAssertNumQueries) -> None:
    make_searchable_recipes()

    # The matching ingredients, synonyms and cuisines are subqueries of the list's one query.
    with django_assert_num_queries(3):
        response = APIClient().get(reverse('recipe-list'), {'q': 'aubergine'})

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == ['Stuffed aubergines', 'Baba ganoush', 'Moussaka']


@pytest.mark.django_db
def test_lists_the_seeded_courses_alphabetically() -> None:
    response = APIClient().get(reverse('course-list'))

    assert response.status_code == 200
    assert [course['name'] for course in response.json()] == ['Baking', 'Breakfast', 'Dessert', 'Main', 'Side']
    assert response.json()[0] == {'slug': 'baking', 'name': 'Baking'}


@pytest.mark.django_db
def test_lists_the_seeded_cuisines_alphabetically() -> None:
    response = APIClient().get(reverse('cuisine-list'))

    assert response.status_code == 200
    assert [cuisine['name'] for cuisine in response.json()] == [
        'British',
        'Chinese',
        'French',
        'Greek',
        'Indian',
        'Italian',
        'Japanese',
        'Mexican',
        'Spanish',
        'Thai',
    ]
    assert response.json()[0] == {'slug': 'british', 'name': 'British'}


@pytest.mark.django_db
def test_a_staff_user_adds_a_cuisine_in_the_admin(admin_client: Client) -> None:
    response = admin_client.post(reverse('admin:recipes_cuisine_add'), {'name': 'Korean', 'slug': 'korean'})

    assert response.status_code == 302
    names = [cuisine['name'] for cuisine in APIClient().get(reverse('cuisine-list')).json()]
    assert names[names.index('Japanese') : names.index('Mexican') + 1] == ['Japanese', 'Korean', 'Mexican']


@pytest.mark.django_db
def test_returns_each_recipes_cuisines_alphabetically() -> None:
    recipe = make_recipe(title='Ramen tacos')
    recipe.cuisines.add(Cuisine.objects.get(slug='mexican'))
    recipe.cuisines.add(Cuisine.objects.get(slug='japanese'))

    response = APIClient().get(reverse('recipe-list'))

    assert response.json()[0]['cuisines'] == [
        {'slug': 'japanese', 'name': 'Japanese'},
        {'slug': 'mexican', 'name': 'Mexican'},
    ]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('params', 'titles'),
    [
        ({'cuisine': 'japanese'}, ['Ramen tacos', 'Sushi']),
        ({'cuisine': 'mexican'}, ['Ramen tacos']),
        ({'cuisine': 'italian'}, []),
        ({'cuisine': 'klingon'}, ['Apple tart', 'Banana bread', 'Ramen tacos', 'Sushi']),
        ({'cuisine': ''}, ['Apple tart', 'Banana bread', 'Ramen tacos', 'Sushi']),
        ({'cuisine': 'japanese', 'q': 'ramen'}, ['Ramen tacos']),
        ({'cuisine': 'french', 'q': 'ramen'}, []),
    ],
)
def test_filters_by_cuisine_and_combines_with_the_search(params: dict[str, str], titles: list[str]) -> None:
    for title, slugs in [
        ('Apple tart', ['french']),
        ('Ramen tacos', ['japanese', 'mexican']),
        ('Sushi', ['japanese']),
        ('Banana bread', []),
    ]:
        make_recipe(title=title).cuisines.set(Cuisine.objects.filter(slug__in=slugs))

    response = APIClient().get(reverse('recipe-list'), params)

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == titles


@pytest.mark.django_db
def test_lists_recipes_with_their_cuisines_and_diet_tags_in_three_queries(
    django_assert_num_queries: DjangoAssertNumQueries,
) -> None:
    for title in ['Apple tart', 'Ramen tacos', 'Sushi']:
        recipe = make_recipe(title=title)
        recipe.cuisines.set(Cuisine.objects.filter(slug__in=['french', 'japanese']))
        add_line(recipe, 'rice')
        add_line(recipe, 'butter', optional=True)

    with django_assert_num_queries(3):
        response = APIClient().get(reverse('recipe-list'))

    assert response.status_code == 200
    assert [(len(recipe['cuisines']), len(recipe['diet_tags'])) for recipe in response.json()] == [(2, 4)] * 3


ALL_FIVE = ['Apple tart', 'Greek salad', 'Pad thai', 'Ramen tacos', 'Risotto']


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('params', 'titles'),
    [
        ('cuisine=italian&cuisine=thai', ['Pad thai', 'Risotto']),
        ('cuisine=japanese&cuisine=mexican', ['Ramen tacos']),
        ('cuisine=italian&cuisine=klingon', ['Risotto']),
        ('course=side', ['Greek salad', 'Ramen tacos']),
        ('course=main&course=side', ['Greek salad', 'Pad thai', 'Ramen tacos', 'Risotto']),
        ('course=brunch', ALL_FIVE),
        ('difficulty=easy&difficulty=hard', ['Greek salad', 'Pad thai', 'Ramen tacos']),
        ('max_total=15', ['Greek salad']),
        ('max_total=40', ['Greek salad', 'Pad thai']),
        ('max_total=45', ['Greek salad', 'Pad thai', 'Risotto']),
        ('max_prep=15', ['Greek salad', 'Pad thai', 'Risotto']),
        ('max_cook=15', ['Greek salad', 'Pad thai']),
        ('one_pot=true', ['Pad thai', 'Risotto']),
        ('one_pot=false', ALL_FIVE),
        ('cuisine=italian&cuisine=thai&max_total=30', ['Pad thai']),
        ('course=main&difficulty=medium', ['Risotto']),
        ('q=pad&one_pot=true', ['Pad thai']),
    ],
)
def test_filters_the_list_and_combines_the_filters(params: str, titles: list[str]) -> None:
    for title, cuisines, courses, difficulty, prep, cook, extra, extra_label, one_pot in [
        ('Apple tart', ['french'], ['dessert'], 'medium', 30, 40, 30, 'chilling', False),
        ('Greek salad', ['greek'], ['side'], 'easy', 15, 0, 0, '', False),
        ('Pad thai', ['thai'], ['main'], 'easy', 15, 15, 0, '', True),
        ('Ramen tacos', ['japanese', 'mexican'], ['main', 'side'], 'hard', 30, 30, 0, '', False),
        ('Risotto', ['italian'], ['main'], 'medium', 10, 30, 5, 'resting', True),
    ]:
        recipe = make_recipe(
            title=title,
            difficulty=difficulty,
            prep_minutes=prep,
            cook_minutes=cook,
            extra_minutes=extra,
            extra_label=extra_label,
            one_pot=one_pot,
        )
        recipe.cuisines.set(Cuisine.objects.filter(slug__in=cuisines))
        recipe.courses.set(Course.objects.filter(slug__in=courses))

    response = APIClient().get(f'{reverse("recipe-list")}?{params}')

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == titles


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('params', 'parameter'),
    [
        ('max_total=abc', 'max_total'),
        ('max_prep=0', 'max_prep'),
        ('difficulty=eazy', 'difficulty'),
        ('diet=halal', 'diet'),
    ],
)
def test_refuses_a_malformed_filter(params: str, parameter: str) -> None:
    response = APIClient().get(f'{reverse("recipe-list")}?{params}')

    assert response.status_code == 400
    assert list(response.json()) == [parameter]


@pytest.mark.django_db
def test_filters_with_cuisines_and_courses_in_five_queries(django_assert_num_queries: DjangoAssertNumQueries) -> None:
    for title, cuisine, course in [
        ('Apple tart', 'french', 'dessert'),
        ('Coq au vin', 'french', 'main'),
        ('Risotto', 'italian', 'main'),
    ]:
        recipe = make_recipe(title=title)
        recipe.cuisines.set(Cuisine.objects.filter(slug=cuisine))
        recipe.courses.set(Course.objects.filter(slug=course))

    # One existence check each for the cuisines and the courses, the list, then the cuisines and diet tags prefetches.
    with django_assert_num_queries(5):
        response = APIClient().get(reverse('recipe-list'), {'cuisine': 'french', 'course': 'main'})

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == ['Coq au vin']


ALL_SIX = ['Bread pudding', 'Chana masala', 'Cheese on toast', 'Herb salad', 'Pad thai', 'Satay tofu']


# Six recipes whose diet tags and ingredients the diet and ingredient filter tests pick between.
def make_diet_recipes() -> None:
    bread = flagged('bread', 'contains_gluten')
    butter = flagged('butter', 'contains_dairy')
    eggs = flagged('eggs', 'contains_egg')
    yoghurt = flagged('yoghurt', 'contains_dairy')
    cheddar = flagged('cheddar', 'contains_dairy')
    fish_sauce = flagged('fish sauce', 'contains_fish')
    soy_sauce = flagged('soy sauce', 'contains_gluten')
    chickpeas, onion, peanuts = ingredient('chickpeas'), ingredient('onion'), ingredient('peanuts')
    rice_noodles, tofu = ingredient('rice noodles'), ingredient('tofu')
    for title, required, optional in [
        ('Bread pudding', [bread, butter, eggs], []),
        ('Chana masala', [chickpeas, onion], [yoghurt]),
        ('Cheese on toast', [bread, cheddar], []),
        ('Herb salad', [], [peanuts]),
        ('Pad thai', [rice_noodles, peanuts, fish_sauce], []),
        ('Satay tofu', [tofu, peanuts, soy_sauce], []),
    ]:
        recipe = make_recipe(title=title)
        for used in required:
            IngredientLine.objects.create(recipe=recipe, ingredient=used)
        for used in optional:
            IngredientLine.objects.create(recipe=recipe, ingredient=used, optional=True)


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('params', 'titles'),
    [
        ('diet=vegan', ['Chana masala', 'Satay tofu']),
        ('diet=vegetarian', ['Bread pudding', 'Chana masala', 'Cheese on toast', 'Satay tofu']),
        ('diet=gluten_free', ['Chana masala', 'Pad thai']),
        ('diet=dairy_free', ['Chana masala', 'Pad thai', 'Satay tofu']),
        ('diet=vegetarian&diet=dairy_free', ['Chana masala', 'Satay tofu']),
        ('diet=vegan&diet=gluten_free', ['Chana masala']),
        ('include_ingredient=peanuts', ['Herb salad', 'Pad thai', 'Satay tofu']),
        (
            'include_ingredient=peanuts&include_ingredient=cheddar',
            ['Cheese on toast', 'Herb salad', 'Pad thai', 'Satay tofu'],
        ),
        ('include_ingredient=peanuts&include_ingredient=klingon', ['Herb salad', 'Pad thai', 'Satay tofu']),
        ('include_ingredient=klingon', ALL_SIX),
        ('exclude_ingredient=peanuts', ['Bread pudding', 'Chana masala', 'Cheese on toast']),
        ('exclude_ingredient=yoghurt', ['Bread pudding', 'Cheese on toast', 'Herb salad', 'Pad thai', 'Satay tofu']),
        ('exclude_ingredient=peanuts&exclude_ingredient=bread', ['Chana masala']),
        ('exclude_ingredient=klingon', ALL_SIX),
        ('include_ingredient=peanuts&exclude_ingredient=fish-sauce', ['Herb salad', 'Satay tofu']),
        ('diet=vegan&exclude_ingredient=peanuts', ['Chana masala']),
        ('diet=vegetarian&include_ingredient=bread', ['Bread pudding', 'Cheese on toast']),
        ('q=tofu&diet=vegan', ['Satay tofu']),
    ],
)
def test_filters_by_diet_and_ingredients(params: str, titles: list[str]) -> None:
    make_diet_recipes()

    response = APIClient().get(f'{reverse("recipe-list")}?{params}')

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == titles


@pytest.mark.django_db
@pytest.mark.parametrize('diet', ['vegetarian', 'vegan', 'gluten_free', 'dairy_free'])
def test_the_diet_filter_agrees_with_each_recipes_diet_tags(diet: str) -> None:
    make_diet_recipes()

    every_recipe = APIClient().get(reverse('recipe-list')).json()
    filtered = APIClient().get(reverse('recipe-list'), {'diet': diet}).json()

    tagged = [recipe['title'] for recipe in every_recipe if diet in recipe['diet_tags']]
    assert tagged != []
    assert [recipe['title'] for recipe in filtered] == tagged


@pytest.mark.django_db
def test_filters_by_diet_and_ingredients_in_four_queries(django_assert_num_queries: DjangoAssertNumQueries) -> None:
    make_diet_recipes()

    # The included ingredients' existence check, the list, then the cuisines and diet tags prefetches.
    with django_assert_num_queries(4):
        response = APIClient().get(
            reverse('recipe-list'),
            {'diet': 'vegan', 'include_ingredient': 'peanuts', 'exclude_ingredient': 'bread'},
        )

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == ['Satay tofu']


@pytest.mark.django_db
def test_lists_every_ingredient_alphabetically_with_its_synonyms() -> None:
    ingredient('butter')
    aubergine = ingredient('aubergine')
    for name in ['eggplant', 'brinjal']:
        IngredientSynonym.objects.create(ingredient=aubergine, name=name)

    response = APIClient().get(reverse('ingredient-list'))

    assert response.status_code == 200
    assert response.json() == [
        {'slug': 'aubergine', 'name': 'aubergine', 'synonyms': ['brinjal', 'eggplant']},
        {'slug': 'butter', 'name': 'butter', 'synonyms': []},
    ]


@pytest.mark.django_db
def test_lists_ingredients_in_two_queries(django_assert_num_queries: DjangoAssertNumQueries) -> None:
    for name in ['aubergine', 'coriander', 'courgette']:
        used = ingredient(name)
        for synonym in ['one', 'two']:
            IngredientSynonym.objects.create(ingredient=used, name=f'{name} {synonym}')

    with django_assert_num_queries(2):
        response = APIClient().get(reverse('ingredient-list'))

    assert response.status_code == 200
    assert len(response.json()) == 3


@pytest.mark.django_db
def test_a_staff_user_adds_a_recipe_with_cuisines_in_the_admin(admin_client: Client) -> None:
    japanese = Cuisine.objects.get(slug='japanese')
    mexican = Cuisine.objects.get(slug='mexican')

    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {**admin_details(), 'title': 'Ramen tacos', 'description': '', 'cuisines': [japanese.id, mexican.id]},
    )

    assert response.status_code == 302
    assert list(Recipe.objects.get().cuisines.values_list('slug', flat=True)) == ['japanese', 'mexican']


@pytest.mark.django_db
def test_the_admin_refuses_a_recipe_with_no_cuisine(admin_client: Client) -> None:
    response = admin_client.post(
        reverse('admin:recipes_recipe_add'), {**admin_details(), 'title': 'Shakshuka', 'description': ''}
    )

    assert response.status_code == 200
    assert Recipe.objects.count() == 0


@pytest.mark.django_db
def test_returns_a_yield_instead_of_servings() -> None:
    make_recipe(title='Oat cookies', servings=None, yield_amount=12, yield_unit='cookies')

    response = APIClient().get(reverse('recipe-detail', args=['oat-cookies']))

    assert {key: response.json()[key] for key in ['servings', 'yield_amount', 'yield_unit']} == {
        'servings': None,
        'yield_amount': 12,
        'yield_unit': 'cookies',
    }


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('prep_minutes', 'cook_minutes', 'extra_minutes', 'extra_label', 'total_minutes'),
    [
        (10, 20, 0, '', 30),
        (15, 0, 0, '', 15),
        (0, 0, 0, '', 0),
        (20, 45, 120, 'marinating', 185),
    ],
)
def test_total_time_is_prep_plus_cook_plus_extra(
    prep_minutes: int, cook_minutes: int, extra_minutes: int, extra_label: str, total_minutes: int
) -> None:
    make_recipe(
        title='Shakshuka',
        prep_minutes=prep_minutes,
        cook_minutes=cook_minutes,
        extra_minutes=extra_minutes,
        extra_label=extra_label,
    )

    listed = APIClient().get(reverse('recipe-list')).json()[0]
    detail = APIClient().get(reverse('recipe-detail', args=['shakshuka'])).json()

    assert (listed['total_minutes'], detail['total_minutes']) == (total_minutes, total_minutes)


@pytest.mark.django_db
def test_returns_a_recipe_with_its_details_ingredients_method_and_diet_tags_in_eight_queries(
    django_assert_num_queries: DjangoAssertNumQueries,
) -> None:
    recipe = make_recipe(title='Shakshuka')
    recipe.cuisines.set(Cuisine.objects.filter(slug__in=['french', 'japanese']))
    recipe.courses.set(Course.objects.filter(slug__in=['main', 'side']))
    recipe.equipment.set(Equipment.objects.filter(slug__in=['oven', 'hob']))
    sauce = IngredientGroup.objects.create(recipe=recipe, name='For the sauce')
    to_serve = IngredientGroup.objects.create(recipe=recipe, name='To serve')
    for group, name in [(None, 'egg'), (None, 'salt'), (sauce, 'tomato'), (sauce, 'onion'), (to_serve, 'feta')]:
        add_line(recipe, name, group=group)
    for text in ['Fry the onion.', 'Add the tomatoes.', 'Crack in the eggs.']:
        Step.objects.create(recipe=recipe, text=text)

    with django_assert_num_queries(8):
        response = APIClient().get(reverse('recipe-detail', args=['shakshuka']))

    body = response.json()
    assert [len(body[key]) for key in ['cuisines', 'courses', 'equipment', 'ingredient_lines', 'steps']] == [
        2,
        2,
        2,
        2,
        3,
    ]
    assert [len(group['lines']) for group in body['ingredient_groups']] == [2, 1]


@pytest.mark.django_db
def test_a_staff_user_adds_a_recipe_with_all_its_details_in_the_admin(admin_client: Client) -> None:
    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {
            'title': 'Oat cookies',
            'description': '',
            'cuisines': [Cuisine.objects.get(slug='british').id],
            'courses': list(Course.objects.filter(slug__in=['baking', 'dessert']).values_list('id', flat=True)),
            'difficulty': 'hard',
            'prep_minutes': 15,
            'cook_minutes': 12,
            'extra_minutes': 30,
            'extra_label': 'chilling',
            'servings': '',
            'yield_amount': 12,
            'yield_unit': 'cookies',
            'equipment': list(Equipment.objects.filter(slug__in=['oven', 'stand-mixer']).values_list('id', flat=True)),
            'one_pot': 'on',
            'source': 'Grandma Rose',
            **no_inlines(),
        },
    )

    assert response.status_code == 302
    detail = APIClient().get(reverse('recipe-detail', args=['oat-cookies'])).json()
    assert {key: detail[key] for key in detail if key not in ['id', 'slug', 'title', 'description']} == {
        'cuisines': [{'slug': 'british', 'name': 'British'}],
        'courses': [{'slug': 'baking', 'name': 'Baking'}, {'slug': 'dessert', 'name': 'Dessert'}],
        'difficulty': 'hard',
        'prep_minutes': 15,
        'cook_minutes': 12,
        'extra_minutes': 30,
        'extra_label': 'chilling',
        'total_minutes': 57,
        'servings': None,
        'yield_amount': 12,
        'yield_unit': 'cookies',
        'equipment': [{'slug': 'oven', 'name': 'Oven'}, {'slug': 'stand-mixer', 'name': 'Stand mixer'}],
        'one_pot': True,
        'source': 'Grandma Rose',
        'photo': None,
        'diet_tags': [],
        'ingredient_lines': [],
        'ingredient_groups': [],
        'steps': [],
        'diet_tag_conflicts': [],
    }


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('fields', 'message'),
    [
        ({'servings': 4, 'yield_amount': 12, 'yield_unit': 'cookies'}, 'Give either servings or a yield'),
        ({'servings': '', 'yield_amount': '', 'yield_unit': ''}, 'Give either servings or a yield'),
        ({'servings': '', 'yield_amount': 12, 'yield_unit': ''}, 'Give either servings or a yield'),
        ({'servings': '', 'yield_amount': '', 'yield_unit': 'cookies'}, 'Give either servings or a yield'),
        ({'extra_minutes': 30, 'extra_label': ''}, 'Give extra time with its label'),
        ({'extra_minutes': 0, 'extra_label': 'resting'}, 'Give extra time with its label'),
        ({'courses': []}, 'This field is required.'),
        ({'difficulty': ''}, 'This field is required.'),
        ({'prep_minutes': ''}, 'This field is required.'),
        ({'cook_minutes': ''}, 'This field is required.'),
        ({'source': ''}, 'This field is required.'),
        ({'difficulty': 'impossible'}, 'Select a valid choice.'),
        ({'prep_minutes': -5}, 'Ensure this value is greater than or equal to 0.'),
        ({'servings': 0}, 'Ensure this value is greater than or equal to 1.'),
        (
            {'servings': '', 'yield_amount': 0, 'yield_unit': 'cookies'},
            'Ensure this value is greater than or equal to 1.',
        ),
    ],
)
def test_the_admin_refuses_a_recipe_with_details_that_dont_fit(
    admin_client: Client, fields: dict[str, Any], message: str
) -> None:
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {**admin_details(), 'title': 'Shakshuka', 'description': '', 'cuisines': [italian.id], **fields},
    )

    assert response.status_code == 200
    assert message in response.content.decode()
    assert Recipe.objects.count() == 0


@pytest.mark.django_db
def test_a_staff_user_adds_equipment_in_the_admin_and_gives_it_to_a_recipe(admin_client: Client) -> None:
    response = admin_client.post(reverse('admin:recipes_equipment_add'), {'name': 'Wok', 'slug': 'wok'})
    recipe = make_recipe(title='Egg fried rice')

    edit = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {
            **admin_details(),
            'title': 'Egg fried rice',
            'description': '',
            'cuisines': [Cuisine.objects.get(slug='chinese').id],
            'equipment': [Equipment.objects.get(slug='wok').id],
        },
    )

    assert (response.status_code, edit.status_code) == (302, 302)
    detail = APIClient().get(reverse('recipe-detail', args=['egg-fried-rice'])).json()
    assert detail['equipment'] == [{'slug': 'wok', 'name': 'Wok'}]


@pytest.mark.django_db
def test_returns_the_ingredients_with_ungrouped_lines_first_then_each_group_and_the_method_in_order() -> None:
    recipe = make_recipe(title='Shakshuka')
    # Created out of order, so only position can put them right.
    to_serve = IngredientGroup.objects.create(recipe=recipe, name='To serve', position=2)
    sauce = IngredientGroup.objects.create(recipe=recipe, name='For the sauce', position=1)
    feta = add_line(recipe, 'feta', group=to_serve, amount=Decimal(50), unit='g', note='crumbled')
    chilli = add_line(recipe, 'chilli flakes', group=to_serve, position=1, optional=True)
    tomatoes = add_line(
        recipe,
        'chopped tomatoes',
        group=sauce,
        position=1,
        amount=Decimal(1),
        unit='tin',
        original_text='1 tin of chopped tomatoes',
    )
    onion = add_line(recipe, 'onion', group=sauce, amount=Decimal(1), note='finely chopped')
    salt = add_line(recipe, 'salt', position=2, note='to taste')
    eggs = add_line(recipe, 'egg', position=1, amount=Decimal(2), amount_max=Decimal(3))
    oil = add_line(recipe, 'olive oil', amount=Decimal('1.5'), unit='tbsp')
    crack = Step.objects.create(recipe=recipe, position=3, text='Crack in the eggs and cover.')
    fry = Step.objects.create(recipe=recipe, position=1, text='Fry the onion in the oil until soft.')
    simmer = Step.objects.create(recipe=recipe, position=2, text='Add the tomatoes and simmer for 10 minutes.')

    response = APIClient().get(reverse('recipe-detail', args=['shakshuka']))

    def line(row: IngredientLine, slug: str, name: str, **fields: Any) -> dict[str, Any]:
        return {
            'id': row.id,
            'amount': None,
            'amount_max': None,
            'unit': '',
            'ingredient': {'slug': slug, 'name': name},
            'note': '',
            'optional': False,
            **fields,
        }

    body = response.json()
    assert body['ingredient_lines'] == [
        line(oil, 'olive-oil', 'olive oil', amount=1.5, unit='tbsp'),
        line(eggs, 'egg', 'egg', amount=2.0, amount_max=3.0),
        line(salt, 'salt', 'salt', note='to taste'),
    ]
    assert body['ingredient_groups'] == [
        {
            'id': sauce.id,
            'name': 'For the sauce',
            'lines': [
                line(onion, 'onion', 'onion', amount=1.0, note='finely chopped'),
                line(tomatoes, 'chopped-tomatoes', 'chopped tomatoes', amount=1.0, unit='tin'),
            ],
        },
        {
            'id': to_serve.id,
            'name': 'To serve',
            'lines': [
                line(feta, 'feta', 'feta', amount=50.0, unit='g', note='crumbled'),
                line(chilli, 'chilli-flakes', 'chilli flakes', optional=True),
            ],
        },
    ]
    assert body['steps'] == [
        {'id': fry.id, 'text': 'Fry the onion in the oil until soft.'},
        {'id': simmer.id, 'text': 'Add the tomatoes and simmer for 10 minutes.'},
        {'id': crack.id, 'text': 'Crack in the eggs and cover.'},
    ]


@pytest.mark.django_db
def test_a_staff_user_adds_an_ingredient_under_its_uk_name_in_the_admin(admin_client: Client) -> None:
    response = admin_client.post(
        reverse('admin:recipes_ingredient_add'),
        {'name': 'courgette', 'slug': 'courgette', **inline_forms('synonyms', [])},
    )

    assert response.status_code == 302
    assert list(Ingredient.objects.values_list('name', 'slug')) == [('courgette', 'courgette')]


def line_row(name: str, **fields: Any) -> dict[str, Any]:
    return {
        'position': 0,
        'group': '',
        'amount': '',
        'amount_max': '',
        'unit': '',
        'ingredient': ingredient(name).id,
        'note': '',
        'original_text': '',
        **fields,
    }


@pytest.mark.django_db
def test_a_staff_user_adds_a_recipe_with_ingredients_and_steps_in_the_admin(admin_client: Client) -> None:
    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {
            **admin_details(),
            'title': 'Shakshuka',
            'description': '',
            'cuisines': [Cuisine.objects.get(slug='italian').id],
            **inline_forms(
                'ingredient_lines',
                [
                    line_row('egg', amount='2', amount_max='3', original_text='2-3 eggs'),
                    line_row('salt', position=1, note='to taste', optional='on'),
                ],
            ),
            **inline_forms('steps', [{'position': 2, 'text': 'Crack in the eggs.'}, {'position': 1, 'text': 'Fry.'}]),
        },
    )

    assert response.status_code == 302
    detail = APIClient().get(reverse('recipe-detail', args=['shakshuka'])).json()
    assert [
        (line['ingredient']['name'], line['amount'], line['amount_max'], line['note'], line['optional'])
        for line in detail['ingredient_lines']
    ] == [('egg', 2.0, 3.0, '', False), ('salt', None, None, 'to taste', True)]
    assert [step['text'] for step in detail['steps']] == ['Fry.', 'Crack in the eggs.']
    assert list(IngredientLine.objects.values_list('original_text', flat=True)) == ['2-3 eggs', '']


@pytest.mark.django_db
def test_a_staff_user_adds_groups_to_a_recipe_and_puts_lines_in_them_in_the_admin(admin_client: Client) -> None:
    recipe = make_recipe(title='Shakshuka')
    recipe.cuisines.add(Cuisine.objects.get(slug='italian'))
    edit = {
        **admin_details(),
        'title': 'Shakshuka',
        'description': '',
        'cuisines': [Cuisine.objects.get(slug='italian').id],
    }

    groups = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {
            **edit,
            **inline_forms(
                'ingredient_groups', [{'position': 2, 'name': 'To serve'}, {'position': 1, 'name': 'For the sauce'}]
            ),
        },
    )
    to_serve, sauce = (IngredientGroup.objects.get(name=name) for name in ['To serve', 'For the sauce'])
    lines = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {
            **edit,
            **inline_forms(
                'ingredient_groups',
                [
                    {'id': to_serve.id, 'recipe': recipe.id, 'position': 2, 'name': 'To serve'},
                    {'id': sauce.id, 'recipe': recipe.id, 'position': 1, 'name': 'For the sauce'},
                ],
                initial=2,
            ),
            **inline_forms(
                'ingredient_lines',
                [
                    line_row('feta', group=to_serve.id, amount='50', unit='g'),
                    line_row('chopped tomatoes', group=sauce.id, amount='1', unit='tin'),
                    line_row('egg', amount='4'),
                ],
            ),
        },
    )

    assert (groups.status_code, lines.status_code) == (302, 302)
    detail = APIClient().get(reverse('recipe-detail', args=['shakshuka'])).json()
    assert [line['ingredient']['name'] for line in detail['ingredient_lines']] == ['egg']
    assert [
        (group['name'], [(line['ingredient']['name'], line['unit']) for line in group['lines']])
        for group in detail['ingredient_groups']
    ] == [('For the sauce', [('chopped tomatoes', 'tin')]), ('To serve', [('feta', 'g')])]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('fields', 'message'),
    [
        ({'amount': '3', 'amount_max': '2'}, 'Give a range with its lower amount first'),
        ({'amount': '2', 'amount_max': '2'}, 'Give a range with its lower amount first'),
        ({'amount': '', 'amount_max': '3'}, 'Give a range with its lower amount first'),
        ({'amount': '0'}, 'Give an amount above 0'),
        ({'unit': 'bucket'}, 'Select a valid choice.'),
        ({'ingredient': '', 'note': 'to taste'}, 'This field is required.'),
    ],
)
def test_the_admin_refuses_an_ingredient_line_that_doesnt_fit(
    admin_client: Client, fields: dict[str, Any], message: str
) -> None:
    response = admin_client.post(
        reverse('admin:recipes_recipe_add'),
        {
            **admin_details(),
            'title': 'Shakshuka',
            'description': '',
            'cuisines': [Cuisine.objects.get(slug='italian').id],
            **inline_forms('ingredient_lines', [line_row('egg', **fields)]),
        },
    )

    assert response.status_code == 200
    assert message in response.content.decode()
    assert (Recipe.objects.count(), IngredientLine.objects.count()) == (0, 0)


@pytest.mark.django_db
def test_the_admin_refuses_a_line_in_another_recipes_group(admin_client: Client) -> None:
    other = IngredientGroup.objects.create(recipe=make_recipe(title='Apple tart'), name='For the pastry')
    recipe = make_recipe(title='Shakshuka')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {
            **admin_details(),
            'title': 'Shakshuka',
            'description': '',
            'cuisines': [Cuisine.objects.get(slug='italian').id],
            **inline_forms('ingredient_lines', [line_row('egg', group=other.id)]),
        },
    )

    assert response.status_code == 200
    assert 'Select a valid choice.' in response.content.decode()
    assert IngredientLine.objects.count() == 0


@pytest.mark.django_db
def test_deleting_a_group_in_the_admin_keeps_its_lines_above_the_groups(admin_client: Client) -> None:
    recipe = make_recipe(title='Shakshuka')
    recipe.cuisines.add(Cuisine.objects.get(slug='italian'))
    sauce = IngredientGroup.objects.create(recipe=recipe, name='For the sauce')
    add_line(recipe, 'onion', group=sauce)

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {
            **admin_details(),
            'title': 'Shakshuka',
            'description': '',
            'cuisines': [Cuisine.objects.get(slug='italian').id],
            **inline_forms(
                'ingredient_groups',
                [{'id': sauce.id, 'recipe': recipe.id, 'position': 0, 'name': 'For the sauce', 'DELETE': 'on'}],
                initial=1,
            ),
        },
    )

    assert response.status_code == 302
    detail = APIClient().get(reverse('recipe-detail', args=['shakshuka'])).json()
    assert ([line['ingredient']['name'] for line in detail['ingredient_lines']], detail['ingredient_groups']) == (
        ['onion'],
        [],
    )


PHOTO = {
    'photo_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Shakshuka_%28Tel_Aviv%29.jpg',
    'photo_author': 'Jane Doe',
    'photo_licence': 'CC BY-SA 4.0',
    'photo_source_url': 'https://commons.wikimedia.org/wiki/File:Shakshuka_(Tel_Aviv).jpg',
}

PHOTO_IN_THE_API = {
    'thumbnails': [
        {
            'width': width,
            'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Shakshuka_%28Tel_Aviv%29.jpg/'
            f'{width}px-Shakshuka_%28Tel_Aviv%29.jpg',
        }
        for width in [330, 500, 960, 1280]
    ],
    'author': 'Jane Doe',
    'licence': 'CC BY-SA 4.0',
    'source_url': 'https://commons.wikimedia.org/wiki/File:Shakshuka_(Tel_Aviv).jpg',
}


@pytest.mark.django_db
def test_lists_and_returns_a_recipes_photo_with_its_thumbnails_and_credit_or_null_without_one() -> None:
    make_recipe(title='Shakshuka', **PHOTO)
    make_recipe(title='Apple tart')

    listed = APIClient().get(reverse('recipe-list')).json()
    details = [APIClient().get(reverse('recipe-detail', args=[slug])).json() for slug in ['apple-tart', 'shakshuka']]

    assert [(recipe['title'], recipe['photo']) for recipe in listed] == [
        ('Apple tart', None),
        ('Shakshuka', PHOTO_IN_THE_API),
    ]
    assert [(recipe['title'], recipe['photo']) for recipe in details] == [
        ('Apple tart', None),
        ('Shakshuka', PHOTO_IN_THE_API),
    ]


@pytest.mark.django_db
def test_a_staff_user_gives_a_recipe_a_credited_photo_in_the_admin(admin_client: Client) -> None:
    recipe = make_recipe(title='Shakshuka')
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {**admin_details(), 'title': 'Shakshuka', 'description': '', 'cuisines': [italian.id], **PHOTO},
    )

    assert response.status_code == 302
    detail = APIClient().get(reverse('recipe-detail', args=['shakshuka'])).json()
    assert detail['photo'] == PHOTO_IN_THE_API


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('fields', 'message'),
    [
        ({**PHOTO, 'photo_author': ''}, 'Give a photo with its author, licence and source, or none of them.'),
        ({**PHOTO, 'photo_licence': ''}, 'Give a photo with its author, licence and source, or none of them.'),
        ({**PHOTO, 'photo_source_url': ''}, 'Give a photo with its author, licence and source, or none of them.'),
        ({'photo_author': 'Jane Doe'}, 'Give a photo with its author, licence and source, or none of them.'),
        (
            {**PHOTO, 'photo_url': 'https://example.com/shakshuka.jpg'},
            'Give the address of a JPEG, PNG or WebP file on Wikimedia Commons',
        ),
        (
            {**PHOTO, 'photo_url': 'https://commons.wikimedia.org/wiki/File:Shakshuka_(Tel_Aviv).jpg'},
            'Give the address of a JPEG, PNG or WebP file on Wikimedia Commons',
        ),
        (
            {**PHOTO, 'photo_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Shakshuka.svg'},
            'Give the address of a JPEG, PNG or WebP file on Wikimedia Commons',
        ),
        ({**PHOTO, 'photo_source_url': 'Wikimedia Commons'}, 'Enter a valid URL.'),
        (
            {**PHOTO, 'photo_source_url': 'https://example.com/shakshuka'},
            'Give the photo&#x27;s page on Wikimedia Commons',
        ),
    ],
)
def test_the_admin_refuses_a_photo_that_doesnt_fit(admin_client: Client, fields: dict[str, Any], message: str) -> None:
    recipe = make_recipe(title='Shakshuka')
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {**admin_details(), 'title': 'Shakshuka', 'description': '', 'cuisines': [italian.id], **fields},
    )

    assert response.status_code == 200
    assert message in response.content.decode()
    recipe.refresh_from_db()
    assert recipe.photo_url == ''


def flagged(name: str, *flags: str) -> Ingredient:
    return Ingredient.objects.create(name=name, slug=name.replace(' ', '-'), **dict.fromkeys(flags, True))


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('flags', 'diet_tags'),
    [
        ((), ['vegetarian', 'vegan', 'gluten_free', 'dairy_free']),
        (('contains_meat',), ['gluten_free', 'dairy_free']),
        (('contains_fish',), ['gluten_free', 'dairy_free']),
        (('contains_dairy',), ['vegetarian', 'gluten_free']),
        (('contains_egg',), ['vegetarian', 'gluten_free', 'dairy_free']),
        (('contains_other_animal_product',), ['vegetarian', 'gluten_free', 'dairy_free']),
        (('contains_gluten',), ['vegetarian', 'vegan', 'dairy_free']),
        (('contains_dairy', 'contains_gluten'), ['vegetarian']),
    ],
)
def test_works_out_the_diet_tags_from_what_every_ingredient_contains(
    flags: tuple[str, ...], diet_tags: list[str]
) -> None:
    recipe = make_recipe(title='Risotto')
    add_line(recipe, 'rice')
    sauce = IngredientGroup.objects.create(recipe=recipe, name='For the sauce')
    IngredientLine.objects.create(recipe=recipe, group=sauce, ingredient=flagged('stock', *flags))

    listed = APIClient().get(reverse('recipe-list')).json()[0]
    detail = APIClient().get(reverse('recipe-detail', args=['risotto'])).json()

    assert (listed['diet_tags'], detail['diet_tags']) == (diet_tags, diet_tags)


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('lines', 'diet_tags'),
    [
        ([], []),
        ([('rice', True)], []),
        ([('rice', False)], ['vegetarian', 'vegan', 'gluten_free', 'dairy_free']),
    ],
)
def test_claims_no_diet_until_the_recipe_has_a_required_ingredient(
    lines: list[tuple[str, bool]], diet_tags: list[str]
) -> None:
    recipe = make_recipe(title='Risotto')
    for name, optional in lines:
        add_line(recipe, name, optional=optional)

    detail = APIClient().get(reverse('recipe-detail', args=['risotto'])).json()

    assert detail['diet_tags'] == diet_tags


@pytest.mark.django_db
def test_optional_lines_keep_the_diet_tags_and_name_the_ones_they_would_take_away() -> None:
    recipe = make_recipe(title='Spaghetti aglio e olio')
    IngredientLine.objects.create(recipe=recipe, ingredient=flagged('spaghetti', 'contains_gluten'))
    add_line(recipe, 'garlic')
    bacon = flagged('bacon', 'contains_meat')
    IngredientLine.objects.create(recipe=recipe, ingredient=bacon, optional=True)
    to_serve = IngredientGroup.objects.create(recipe=recipe, name='To serve')
    parmesan = flagged('parmesan', 'contains_dairy')
    IngredientLine.objects.create(recipe=recipe, group=to_serve, ingredient=parmesan, optional=True)
    IngredientLine.objects.create(recipe=recipe, group=to_serve, ingredient=parmesan, optional=True, note='to grate')
    # Gluten-free isn't one of the recipe's tags, so an optional crouton takes nothing away.
    IngredientLine.objects.create(
        recipe=recipe, group=to_serve, ingredient=flagged('croutons', 'contains_gluten'), optional=True
    )
    add_line(recipe, 'parsley', optional=True)

    listed = APIClient().get(reverse('recipe-list')).json()[0]
    detail = APIClient().get(reverse('recipe-detail', args=['spaghetti-aglio-e-olio'])).json()

    assert listed['diet_tags'] == ['vegetarian', 'vegan', 'dairy_free']
    assert detail['diet_tags'] == ['vegetarian', 'vegan', 'dairy_free']
    assert detail['diet_tag_conflicts'] == [
        {'ingredient': {'slug': 'bacon', 'name': 'bacon'}, 'diet_tags': ['vegetarian', 'vegan']},
        {'ingredient': {'slug': 'parmesan', 'name': 'parmesan'}, 'diet_tags': ['vegan', 'dairy_free']},
    ]


@pytest.mark.django_db
def test_a_staff_user_records_what_an_ingredient_contains_in_the_admin(admin_client: Client) -> None:
    recipe = make_recipe(title='Noodle soup')
    add_line(recipe, 'egg noodles')

    response = admin_client.post(
        reverse('admin:recipes_ingredient_change', args=[Ingredient.objects.get().id]),
        {
            'name': 'egg noodles',
            'slug': 'egg-noodles',
            'contains_gluten': 'on',
            'contains_egg': 'on',
            **inline_forms('synonyms', []),
        },
    )

    assert response.status_code == 302
    detail = APIClient().get(reverse('recipe-detail', args=['noodle-soup'])).json()
    assert detail['diet_tags'] == ['vegetarian', 'dairy_free']


@pytest.mark.django_db
def test_a_staff_user_gives_an_ingredient_synonyms_in_the_admin_and_search_finds_it_by_them(
    admin_client: Client,
) -> None:
    add_line(make_recipe(title='Ratatouille'), 'courgette')

    response = admin_client.post(
        reverse('admin:recipes_ingredient_change', args=[Ingredient.objects.get().id]),
        {
            'name': 'courgette',
            'slug': 'courgette',
            **inline_forms('synonyms', [{'name': 'zucchini'}, {'name': 'baby marrow'}]),
        },
    )

    assert response.status_code == 302
    found = {
        q: [recipe['title'] for recipe in APIClient().get(reverse('recipe-list'), {'q': q}).json()]
        for q in ['zucchini', 'baby marrow']
    }
    assert found == {'zucchini': ['Ratatouille'], 'baby marrow': ['Ratatouille']}


@pytest.mark.django_db
def test_the_admin_refuses_a_synonym_another_ingredient_already_has(admin_client: Client) -> None:
    IngredientSynonym.objects.create(ingredient=ingredient('coriander'), name='cilantro')
    parsley = ingredient('flat-leaf parsley')

    response = admin_client.post(
        reverse('admin:recipes_ingredient_change', args=[parsley.id]),
        {'name': 'flat-leaf parsley', 'slug': 'flat-leaf-parsley', **inline_forms('synonyms', [{'name': 'cilantro'}])},
    )

    assert response.status_code == 200
    assert 'Ingredient synonym with this Name already exists.' in response.content.decode()
    assert list(IngredientSynonym.objects.values_list('ingredient__name', 'name')) == [('coriander', 'cilantro')]
