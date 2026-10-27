import json
from pathlib import Path
from typing import Any

import pytest
from django.core.management import CommandError, call_command
from django.urls import reverse
from rest_framework.test import APIClient

from recipes.models import Equipment, Ingredient, Recipe

# A small catalogue for tests about loading, not about the repo's own file.
SHAKSHUKA: dict[str, Any] = {
    'slug': 'shakshuka',
    'title': 'Shakshuka',
    'description': 'Eggs in spiced tomatoes.',
    'cuisines': ['Spanish'],
    'courses': ['Breakfast', 'Main'],
    'difficulty': 'easy',
    'prep_minutes': 10,
    'cook_minutes': 20,
    'servings': 2,
    'equipment': ['Hob'],
    'one_pot': True,
    'source': 'Tastebook',
    'ingredient_lines': [{'amount': 1, 'unit': 'tbsp', 'ingredient': 'olive oil'}],
    'ingredient_groups': [
        {
            'name': 'For the sauce',
            'lines': [
                {'amount': 1, 'unit': 'tin', 'ingredient': 'chopped tomatoes'},
                {'amount': 0.5, 'amount_max': 1, 'unit': 'tsp', 'ingredient': 'paprika', 'note': 'smoked'},
            ],
        },
        {'name': 'To serve', 'lines': [{'amount': 4, 'ingredient': 'eggs', 'optional': True}]},
    ],
    'steps': ['Soften the tomatoes in the oil.', 'Crack in the eggs and cover.'],
}

FLAPJACKS: dict[str, Any] = {
    'slug': 'flapjacks',
    'title': 'Flapjacks',
    'difficulty': 'easy',
    'prep_minutes': 10,
    'cook_minutes': 25,
    'extra_minutes': 60,
    'extra_label': 'cooling',
    'yield_amount': 12,
    'yield_unit': 'squares',
    'source': 'Tastebook',
    'ingredient_lines': [{'amount': 250, 'unit': 'g', 'ingredient': 'porridge oats'}],
    'steps': ['Bake.'],
}


def catalogue(*recipes: dict[str, Any], ingredients: list[str] | None = None) -> dict[str, Any]:
    return {
        'equipment': ['Hob', 'Oven'],
        'ingredients': ingredients or ['chopped tomatoes', 'eggs', 'olive oil', 'paprika', 'porridge oats'],
        'recipes': list(recipes),
    }


def write(path: Path, contents: dict[str, Any]) -> Path:
    path.write_text(json.dumps(contents), encoding='utf-8')
    return path


def recipe_json(slug: str) -> dict[str, Any]:
    response = APIClient().get(reverse('recipe-detail', args=[slug]))
    assert response.status_code == 200
    return response.json()


def titles() -> list[str]:
    return [recipe['title'] for recipe in APIClient().get(reverse('recipe-list')).json()]


# What a reader of the recipe page sees of each feature the seed has to cover.
def shape(recipe: dict[str, Any]) -> dict[str, Any]:
    lines = [*recipe['ingredient_lines'], *(line for group in recipe['ingredient_groups'] for line in group['lines'])]
    return {
        'groups': [group['name'] for group in recipe['ingredient_groups']],
        'ranges': [line['ingredient']['name'] for line in lines if line['amount_max'] is not None],
        'optional': [line['ingredient']['name'] for line in lines if line['optional']],
        'yield': (recipe['yield_amount'], recipe['yield_unit']),
        'extra': (recipe['extra_minutes'], recipe['extra_label']),
    }


@pytest.mark.django_db
def test_loads_the_repos_catalogue_in_place_of_the_recipes_already_there() -> None:
    Recipe.objects.create(
        title='Typed in the admin', difficulty='easy', prep_minutes=1, cook_minutes=1, servings=1, source='Me'
    )

    call_command('load_catalogue')

    assert titles() == [
        'Chicken tikka masala',
        'Greek salad',
        'Oat and raisin cookies',
        'Spaghetti aglio e olio',
        'Spanish tortilla',
    ]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('slug', 'expected'),
    [
        (
            'chicken-tikka-masala',
            {
                'groups': ['For the marinade', 'For the sauce', 'To serve'],
                'ranges': ['chilli powder'],
                'optional': ['coriander'],
                'yield': (None, ''),
                'extra': (60, 'marinating'),
            },
        ),
        (
            'oat-and-raisin-cookies',
            {
                'groups': [],
                'ranges': [],
                'optional': ['ground cinnamon'],
                'yield': (16, 'cookies'),
                'extra': (30, 'chilling'),
            },
        ),
        (
            'spaghetti-aglio-e-olio',
            {
                'groups': [],
                'ranges': ['extra virgin olive oil', 'dried chilli flakes'],
                'optional': ['parmesan'],
                'yield': (None, ''),
                'extra': (0, ''),
            },
        ),
        (
            'greek-salad',
            {
                'groups': ['For the salad', 'For the dressing'],
                'ranges': [],
                'optional': [],
                'yield': (None, ''),
                'extra': (0, ''),
            },
        ),
        (
            'spanish-tortilla',
            {'groups': [], 'ranges': [], 'optional': [], 'yield': (None, ''), 'extra': (10, 'resting')},
        ),
    ],
)
def test_the_repos_recipes_cover_groups_ranges_optional_lines_a_yield_and_extra_time(
    slug: str, expected: dict[str, Any]
) -> None:
    call_command('load_catalogue')

    assert shape(recipe_json(slug)) == expected


@pytest.mark.django_db
def test_loads_a_recipe_with_its_details_ingredients_and_method(tmp_path: Path) -> None:
    call_command('load_catalogue', write(tmp_path / 'catalogue.json', catalogue(SHAKSHUKA)))

    recipe = recipe_json('shakshuka')
    assert {key: value for key, value in recipe.items() if key not in {'id', 'ingredient_groups', 'steps'}} == {
        'slug': 'shakshuka',
        'title': 'Shakshuka',
        'description': 'Eggs in spiced tomatoes.',
        'cuisines': [{'slug': 'spanish', 'name': 'Spanish'}],
        'difficulty': 'easy',
        'total_minutes': 30,
        'photo': None,
        'courses': [{'slug': 'breakfast', 'name': 'Breakfast'}, {'slug': 'main', 'name': 'Main'}],
        'prep_minutes': 10,
        'cook_minutes': 20,
        'extra_minutes': 0,
        'extra_label': '',
        'servings': 2,
        'yield_amount': None,
        'yield_unit': '',
        'equipment': [{'slug': 'hob', 'name': 'Hob'}],
        'one_pot': True,
        'source': 'Tastebook',
        'ingredient_lines': [
            {
                'id': recipe['ingredient_lines'][0]['id'],
                'amount': 1.0,
                'amount_max': None,
                'unit': 'tbsp',
                'ingredient': {'slug': 'olive-oil', 'name': 'olive oil'},
                'note': '',
                'optional': False,
            }
        ],
    }
    assert [
        (group['name'], [(line['amount'], line['amount_max'], line['ingredient']['name']) for line in group['lines']])
        for group in recipe['ingredient_groups']
    ] == [
        ('For the sauce', [(1.0, None, 'chopped tomatoes'), (0.5, 1.0, 'paprika')]),
        ('To serve', [(4.0, None, 'eggs')]),
    ]
    assert [step['text'] for step in recipe['steps']] == [
        'Soften the tomatoes in the oil.',
        'Crack in the eggs and cover.',
    ]


@pytest.mark.django_db
def test_loading_the_same_file_twice_changes_nothing(tmp_path: Path) -> None:
    path = write(tmp_path / 'catalogue.json', catalogue(SHAKSHUKA, FLAPJACKS))
    call_command('load_catalogue', path)
    first = [recipe_json('shakshuka'), recipe_json('flapjacks')]

    call_command('load_catalogue', path)

    assert [recipe_json('shakshuka'), recipe_json('flapjacks')] == first
    assert first[0]['steps'][1]['text'] == 'Crack in the eggs and cover.'
    assert (Recipe.objects.count(), Ingredient.objects.count(), Equipment.objects.count()) == (2, 5, 2)


@pytest.mark.django_db
def test_loading_an_edited_file_overwrites_the_catalogue_with_it(tmp_path: Path) -> None:
    call_command('load_catalogue', write(tmp_path / 'first.json', catalogue(SHAKSHUKA, FLAPJACKS)))
    shakshuka_id = recipe_json('shakshuka')['id']
    edited = {
        **SHAKSHUKA,
        'title': 'Green shakshuka',
        'servings': None,
        'yield_amount': 1,
        'yield_unit': 'pan',
        'one_pot': False,
        'ingredient_lines': [],
        'ingredient_groups': [{'name': 'For the greens', 'lines': [{'amount': 3, 'ingredient': 'eggs'}]}],
        'steps': ['Wilt the greens.'],
    }
    del edited['equipment']

    call_command(
        'load_catalogue',
        write(tmp_path / 'second.json', catalogue(edited, ingredients=['eggs'])),
    )

    recipe = recipe_json('shakshuka')
    assert (recipe['id'], recipe['title'], recipe['servings'], recipe['yield_amount'], recipe['yield_unit']) == (
        shakshuka_id,
        'Green shakshuka',
        None,
        1,
        'pan',
    )
    assert (recipe['one_pot'], recipe['equipment'], recipe['ingredient_lines']) == (False, [], [])
    assert [
        (group['name'], [(line['amount'], line['ingredient']['name']) for line in group['lines']])
        for group in recipe['ingredient_groups']
    ] == [('For the greens', [(3.0, 'eggs')])]
    assert [step['text'] for step in recipe['steps']] == ['Wilt the greens.']
    assert titles() == ['Green shakshuka']
    assert list(Ingredient.objects.values_list('name', flat=True)) == ['eggs']


def with_line(**line: Any) -> dict[str, Any]:
    return catalogue({**FLAPJACKS, 'ingredient_lines': [{'ingredient': 'porridge oats', **line}]})


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('contents', 'message'),
    [
        (
            catalogue({**FLAPJACKS, 'serves': 4}),
            'Recipe flapjacks has fields the catalogue does not know: serves',
        ),
        (
            catalogue({**FLAPJACKS, 'servings': 4}),
            'Recipe flapjacks: Give either servings or a yield with its unit, not both.',
        ),
        (
            catalogue({**FLAPJACKS, 'extra_label': ''}),
            'Recipe flapjacks: Give extra time with its label (marinating, resting, proving), or neither.',
        ),
        (
            catalogue({**FLAPJACKS, 'cuisines': ['Klingon']}),
            'Recipe flapjacks names no known cuisine: "Klingon"',
        ),
        (
            with_line(ingredient='golden syrup'),
            'Recipe flapjacks names no known ingredient: "golden syrup"',
        ),
        (
            with_line(amount=3, amount_max=2),
            'Recipe flapjacks: Give a range with its lower amount first, such as 2 up to 3.',
        ),
        (
            with_line(unit='handfuls'),
            "Recipe flapjacks: Value 'handfuls' is not a valid choice.",
        ),
        (
            catalogue({key: value for key, value in FLAPJACKS.items() if key != 'slug'}),
            'Every recipe needs a slug: it keeps the recipe the same recipe from one load to the next',
        ),
        (
            catalogue(FLAPJACKS, {**SHAKSHUKA, 'slug': 'flapjacks'}),
            'Recipe slugs must be unique, but these repeat: flapjacks',
        ),
        (
            catalogue(FLAPJACKS, ingredients=['porridge oats', 'Porridge oats']),
            'Ingredient slugs must be unique, but these repeat: porridge-oats',
        ),
    ],
)
def test_a_file_the_database_cant_hold_fails_and_changes_nothing(
    tmp_path: Path, contents: dict[str, Any], message: str
) -> None:
    call_command('load_catalogue', write(tmp_path / 'first.json', catalogue(SHAKSHUKA)))

    with pytest.raises(CommandError) as error:
        call_command('load_catalogue', write(tmp_path / 'second.json', contents))

    assert str(error.value) == message
    assert titles() == ['Shakshuka']
