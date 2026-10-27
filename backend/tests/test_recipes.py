from typing import Any

import pytest
from django.test import Client
from django.urls import reverse
from pytest_django import DjangoAssertNumQueries
from rest_framework.test import APIClient

from recipes.models import Course, Cuisine, Equipment, Recipe

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


# The admin form's version of DETAILS: every field it posts, with one course.
def admin_details() -> dict[str, Any]:
    return {
        **DETAILS,
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
def test_lists_recipes_with_their_cuisines_in_two_queries(django_assert_num_queries: DjangoAssertNumQueries) -> None:
    for title in ['Apple tart', 'Ramen tacos', 'Sushi']:
        make_recipe(title=title).cuisines.set(Cuisine.objects.filter(slug__in=['french', 'japanese']))

    with django_assert_num_queries(2):
        response = APIClient().get(reverse('recipe-list'))

    assert response.status_code == 200
    assert len(response.json()) == 3
    assert [len(recipe['cuisines']) for recipe in response.json()] == [2, 2, 2]


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
def test_returns_a_recipe_with_its_cuisines_courses_and_equipment_in_four_queries(
    django_assert_num_queries: DjangoAssertNumQueries,
) -> None:
    recipe = make_recipe(title='Shakshuka')
    recipe.cuisines.set(Cuisine.objects.filter(slug__in=['french', 'japanese']))
    recipe.courses.set(Course.objects.filter(slug__in=['main', 'side']))
    recipe.equipment.set(Equipment.objects.filter(slug__in=['oven', 'hob']))

    with django_assert_num_queries(4):
        response = APIClient().get(reverse('recipe-detail', args=['shakshuka']))

    assert [len(response.json()[key]) for key in ['cuisines', 'courses', 'equipment']] == [2, 2, 2]


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
