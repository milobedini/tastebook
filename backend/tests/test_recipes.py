import pytest
from django.test import Client
from django.urls import reverse
from pytest_django import DjangoAssertNumQueries
from rest_framework.test import APIClient

from recipes.models import Cuisine, Recipe


@pytest.mark.django_db
def test_lists_recipes_alphabetically_ignoring_case_oldest_first_on_a_tie() -> None:
    for title, description in [
        ('Shakshuka', 'Eggs in spiced tomatoes.'),
        ('banana bread', ''),
        ('Apple tart', 'Sharp apples.'),
        ('Shakshuka', 'Green version.'),
        ('apple pie', ''),
    ]:
        Recipe.objects.create(title=title, description=description)

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
def test_returns_each_recipes_id_slug_title_and_description() -> None:
    recipe = Recipe.objects.create(title='Shakshuka', description='Eggs in spiced tomatoes.')

    response = APIClient().get(reverse('recipe-list'))

    assert response.json() == [
        {
            'id': recipe.id,
            'slug': 'shakshuka',
            'title': 'Shakshuka',
            'description': 'Eggs in spiced tomatoes.',
            'cuisines': [],
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
        reverse('admin:recipes_recipe_add'), {'title': 'Shakshuka', 'description': '', 'cuisines': [italian.id]}
    )

    assert response.status_code == 302
    assert list(Recipe.objects.values_list('title', 'description')) == [('Shakshuka', '')]


@pytest.mark.django_db
def test_a_staff_user_edits_a_recipe_in_the_admin(admin_client: Client) -> None:
    recipe = Recipe.objects.create(title='Shakshuka', description='Eggs in spiced tomatoes.')
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {'title': 'Green shakshuka', 'description': 'With spinach.', 'cuisines': [italian.id]},
    )

    assert response.status_code == 302
    recipe.refresh_from_db()
    assert (recipe.title, recipe.description) == ('Green shakshuka', 'With spinach.')


@pytest.mark.django_db
def test_the_admin_refuses_a_recipe_with_no_title(admin_client: Client) -> None:
    response = admin_client.post(reverse('admin:recipes_recipe_add'), {'title': '', 'description': 'No name.'})

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
    recipe = Recipe.objects.create(title=title)

    assert recipe.slug == slug


@pytest.mark.django_db
def test_numbers_clashing_slugs_from_2_skipping_one_already_taken() -> None:
    for title in ['Shakshuka 2', 'Shakshuka', 'Shakshuka', 'Shakshuka']:
        Recipe.objects.create(title=title)

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
        reverse('admin:recipes_recipe_add'), {'title': 'Apple tart', 'description': '', 'cuisines': [italian.id]}
    )

    assert response.status_code == 302
    assert list(Recipe.objects.values_list('slug', flat=True)) == ['apple-tart']


@pytest.mark.django_db
def test_renaming_a_recipe_in_the_admin_keeps_its_slug(admin_client: Client) -> None:
    recipe = Recipe.objects.create(title='Shakshuka')
    italian = Cuisine.objects.get(slug='italian')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {'title': 'Green shakshuka', 'description': '', 'cuisines': [italian.id]},
    )

    assert response.status_code == 302
    recipe.refresh_from_db()
    assert (recipe.title, recipe.slug) == ('Green shakshuka', 'shakshuka')


@pytest.mark.django_db
@pytest.mark.parametrize(('slug', 'status_code'), [('shakshuka', 200), ('apple-tart', 404)])
def test_returns_a_recipe_by_its_slug_or_404_for_an_unknown_one(slug: str, status_code: int) -> None:
    Recipe.objects.create(title='Shakshuka', description='Eggs in spiced tomatoes.')

    response = APIClient().get(reverse('recipe-detail', args=[slug]))

    assert response.status_code == status_code


@pytest.mark.django_db
def test_returns_the_recipes_id_slug_title_and_description() -> None:
    recipe = Recipe.objects.create(title='Shakshuka', description='Eggs in spiced tomatoes.')
    recipe.cuisines.add(Cuisine.objects.get(slug='italian'))

    response = APIClient().get(reverse('recipe-detail', args=['shakshuka']))

    assert response.json() == {
        'id': recipe.id,
        'slug': 'shakshuka',
        'title': 'Shakshuka',
        'description': 'Eggs in spiced tomatoes.',
        'cuisines': [{'slug': 'italian', 'name': 'Italian'}],
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
        Recipe.objects.create(title=title)

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
    recipe = Recipe.objects.create(title='Ramen tacos')
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
        Recipe.objects.create(title=title).cuisines.set(Cuisine.objects.filter(slug__in=slugs))

    response = APIClient().get(reverse('recipe-list'), params)

    assert response.status_code == 200
    assert [recipe['title'] for recipe in response.json()] == titles


@pytest.mark.django_db
def test_lists_recipes_with_their_cuisines_in_two_queries(django_assert_num_queries: DjangoAssertNumQueries) -> None:
    for title in ['Apple tart', 'Ramen tacos', 'Sushi']:
        Recipe.objects.create(title=title).cuisines.set(Cuisine.objects.filter(slug__in=['french', 'japanese']))

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
        {'title': 'Ramen tacos', 'description': '', 'cuisines': [japanese.id, mexican.id]},
    )

    assert response.status_code == 302
    assert list(Recipe.objects.get().cuisines.values_list('slug', flat=True)) == ['japanese', 'mexican']


@pytest.mark.django_db
def test_the_admin_refuses_a_recipe_with_no_cuisine(admin_client: Client) -> None:
    response = admin_client.post(reverse('admin:recipes_recipe_add'), {'title': 'Shakshuka', 'description': ''})

    assert response.status_code == 200
    assert Recipe.objects.count() == 0
