import pytest
from django.test import Client
from django.urls import reverse

from recipes.models import Recipe


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
