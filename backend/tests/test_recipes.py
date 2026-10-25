import pytest
from django.test import Client
from django.urls import reverse
from rest_framework.test import APIClient

from recipes.models import Recipe


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
        {'id': recipe.id, 'slug': 'shakshuka', 'title': 'Shakshuka', 'description': 'Eggs in spiced tomatoes.'}
    ]


@pytest.mark.django_db
def test_returns_an_empty_list_with_no_recipes() -> None:
    response = APIClient().get(reverse('recipe-list'))

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_a_staff_user_adds_a_recipe_in_the_admin(admin_client: Client) -> None:
    response = admin_client.post(reverse('admin:recipes_recipe_add'), {'title': 'Shakshuka', 'description': ''})

    assert response.status_code == 302
    assert list(Recipe.objects.values_list('title', 'description')) == [('Shakshuka', '')]


@pytest.mark.django_db
def test_a_staff_user_edits_a_recipe_in_the_admin(admin_client: Client) -> None:
    recipe = Recipe.objects.create(title='Shakshuka', description='Eggs in spiced tomatoes.')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {'title': 'Green shakshuka', 'description': 'With spinach.'},
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
    response = admin_client.post(reverse('admin:recipes_recipe_add'), {'title': 'Apple tart', 'description': ''})

    assert response.status_code == 302
    assert list(Recipe.objects.values_list('slug', flat=True)) == ['apple-tart']


@pytest.mark.django_db
def test_renaming_a_recipe_in_the_admin_keeps_its_slug(admin_client: Client) -> None:
    recipe = Recipe.objects.create(title='Shakshuka')

    response = admin_client.post(
        reverse('admin:recipes_recipe_change', args=[recipe.id]),
        {'title': 'Green shakshuka', 'description': ''},
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

    response = APIClient().get(reverse('recipe-detail', args=['shakshuka']))

    assert response.json() == {
        'id': recipe.id,
        'slug': 'shakshuka',
        'title': 'Shakshuka',
        'description': 'Eggs in spiced tomatoes.',
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
