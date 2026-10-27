import json
from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils.text import slugify

from recipes.models import (
    Course,
    Cuisine,
    DietTag,
    Equipment,
    Ingredient,
    IngredientGroup,
    IngredientLine,
    Recipe,
    Step,
)

CATALOGUE_PATH = settings.BASE_DIR / 'recipes' / 'catalogue.json'

Record = dict[str, Any]


class CatalogueError(Exception):
    """The catalogue file says something the database can't hold."""


@dataclass(frozen=True)
class LoadedCatalogue:
    recipes: int
    ingredients: int
    equipment: int


@dataclass(frozen=True)
class _Names:
    cuisines: dict[str, Cuisine]
    courses: dict[str, Course]
    equipment: dict[str, Equipment]
    ingredients: dict[str, Ingredient]


def load_catalogue(path: Path = CATALOGUE_PATH) -> LoadedCatalogue:
    """Makes the catalogue's recipes, ingredients and equipment what the file says, adding, changing and removing."""
    catalogue = _read(path)
    with transaction.atomic():
        names = _Names(
            cuisines=_by_name(Cuisine.objects.all()),
            courses=_by_name(Course.objects.all()),
            equipment=_load_named(Equipment, [{'name': name} for name in catalogue['equipment']], 'Equipment'),
            ingredients=_load_named(Ingredient, catalogue['ingredients'], 'Ingredient'),
        )
        recipes = [_load_recipe(record, names) for record in catalogue['recipes']]
        # Every recipe is in the catalogue until households have private recipes, so the file's are the only ones.
        Recipe.objects.exclude(pk__in=[recipe.pk for recipe in recipes]).delete()
        Equipment.objects.exclude(pk__in=[row.pk for row in names.equipment.values()]).delete()
        Ingredient.objects.exclude(pk__in=[row.pk for row in names.ingredients.values()]).delete()
    return LoadedCatalogue(recipes=len(recipes), ingredients=len(names.ingredients), equipment=len(names.equipment))


def _read(path: Path) -> Record:
    try:
        with path.open(encoding='utf-8') as file:
            catalogue = json.load(file, parse_float=Decimal)
    except (OSError, json.JSONDecodeError) as error:
        raise CatalogueError(f'Could not read {path}: {error}') from error
    keys = {'ingredients', 'equipment', 'recipes'}
    if not isinstance(catalogue, dict) or catalogue.keys() != keys:
        raise CatalogueError(f'{path} must hold exactly these lists: {", ".join(sorted(keys))}')
    slugs = [record.get('slug', '') for record in catalogue['recipes']]
    if '' in slugs:
        raise CatalogueError('Every recipe needs a slug: it keeps the recipe the same recipe from one load to the next')
    _refuse_repeats(slugs, 'Recipe slugs')
    return catalogue


def _refuse_repeats(values: Iterable[str], what: str) -> None:
    repeated = sorted(value for value, count in Counter(values).items() if count > 1)
    if repeated:
        raise CatalogueError(f'{what} must be unique, but these repeat: {", ".join(repeated)}')


def _by_name[M: Cuisine | Course](rows: Iterable[M]) -> dict[str, M]:
    return {row.name: row for row in rows}


def _load_named[M: Equipment | Ingredient](model: type[M], records: list[Record], kind: str) -> dict[str, M]:
    unshaped = [record for record in records if not isinstance(record, dict)]
    if unshaped:
        raise CatalogueError(f'Each {kind.lower()} must be an object with its name, but these are not: {unshaped}')
    names = [record.get('name', '') for record in records]
    # The slug is the row's identity, so two names that slugify alike would be one row.
    _refuse_repeats((slugify(name) for name in names), f'{kind} slugs')
    existing = dict(model.objects.values_list('slug', 'pk'))
    rows: dict[str, M] = {}
    for name, record in zip(names, records, strict=True):
        where = f'{kind} "{name}"'
        # Made afresh, so a field the file leaves out goes back to its default.
        row = model(slug=slugify(name), **_plain_fields(model, record, where, set()))
        _take_place(row, existing.get(row.slug))
        _save(row, where)
        rows[name] = row
    return rows


def _load_recipe(record: Record, names: _Names) -> Recipe:
    slug = record['slug']
    where = f'Recipe {slug}'
    references = {'slug', 'cuisines', 'courses', 'equipment', 'ingredient_lines', 'ingredient_groups', 'steps'}
    recipe = Recipe(slug=slug, **_plain_fields(Recipe, record, where, references))
    _take_place(recipe, Recipe.objects.filter(slug=slug).values_list('pk', flat=True).first())
    _save(recipe, where)
    recipe.cuisines.set(_look_up(names.cuisines, record.get('cuisines', []), where, 'cuisine'))
    recipe.courses.set(_look_up(names.courses, record.get('courses', []), where, 'course'))
    recipe.equipment.set(_look_up(names.equipment, record.get('equipment', []), where, 'equipment'))

    group_records = record.get('ingredient_groups', [])
    groups = [
        IngredientGroup(
            recipe=recipe, position=position, **_plain_fields(IngredientGroup, group, f'{where}, group', {'lines'})
        )
        for position, group in enumerate(group_records)
    ]
    _replace(recipe.ingredient_groups.all(), groups, where)

    placed = [
        (None, record.get('ingredient_lines', [])),
        *zip(groups, (g.get('lines', []) for g in group_records), strict=True),
    ]
    lines = [
        IngredientLine(
            recipe=recipe,
            group=group,
            position=position,
            ingredient=_look_up(names.ingredients, [line.get('ingredient', '')], where, 'ingredient')[0],
            **_plain_fields(IngredientLine, line, f'{where}, ingredient line', {'ingredient'}),
        )
        for group, group_lines in placed
        for position, line in enumerate(group_lines)
    ]
    _replace(recipe.ingredient_lines.all(), lines, where)

    steps = [Step(recipe=recipe, position=position, text=text) for position, text in enumerate(record.get('steps', []))]
    _replace(recipe.steps.all(), steps, where)
    return recipe


def _plain_fields(model: type[models.Model], record: Record, where: str, references: set[str]) -> Record:
    # Position comes from the order in the file, and ids and slugs are the loader's to give.
    allowed = {
        field.name
        for field in model._meta.concrete_fields
        if field.editable and not field.primary_key and not field.is_relation and field.name not in {'position', 'slug'}
    }
    unknown = record.keys() - allowed - references
    if unknown:
        raise CatalogueError(f'{where} has fields the catalogue does not know: {", ".join(sorted(unknown))}')
    return {name: value for name, value in record.items() if name in allowed}


def _look_up[M: models.Model](rows: dict[str, M], names: list[str], where: str, kind: str) -> list[M]:
    missing = [f'"{name}"' for name in names if name not in rows]
    if missing:
        raise CatalogueError(f'{where} names no known {kind}: {", ".join(missing)}')
    return [rows[name] for name in names]


def _replace[M: models.Model](existing: models.QuerySet[M], rows: list[M], where: str) -> None:
    # Each row reuses the id of the existing row in its place, so loading an unchanged file keeps every id.
    ids = list(existing.order_by('id').values_list('pk', flat=True))
    for row, row_id in zip(rows, ids, strict=False):
        _take_place(row, row_id)
    for row in rows:
        _save(row, where)
    existing.model.objects.filter(pk__in=ids[len(rows) :]).delete()


def _take_place(row: models.Model, pk: int | None) -> None:
    if pk is not None:
        row.pk = pk
        # Saved as the existing row, so the uniqueness checks don't count it against itself.
        row._state.adding = False


def _save(row: models.Model, where: str) -> None:
    try:
        row.full_clean()
    except ValidationError as error:
        raise CatalogueError(f'{where}: {" ".join(error.messages)}') from error
    row.save()


# The ingredient flags that rule each diet tag out.
_RULED_OUT_BY: dict[DietTag, tuple[str, ...]] = {
    DietTag.VEGETARIAN: ('contains_meat', 'contains_fish'),
    DietTag.VEGAN: (
        'contains_meat',
        'contains_fish',
        'contains_dairy',
        'contains_egg',
        'contains_other_animal_product',
    ),
    DietTag.GLUTEN_FREE: ('contains_gluten',),
    DietTag.DAIRY_FREE: ('contains_dairy',),
}


@dataclass(frozen=True)
class DietTagConflict:
    """An optional ingredient that would take diet tags away from its recipe, if it were used."""

    ingredient: Ingredient
    diet_tags: list[DietTag]


def _allows(ingredient: Ingredient, tag: DietTag) -> bool:
    return not any(getattr(ingredient, flag) for flag in _RULED_OUT_BY[tag])


def diet_tags(lines: Iterable[IngredientLine]) -> list[DietTag]:
    """The diet tags every required line allows. Optional lines never take one away."""
    required = [line.ingredient for line in lines if not line.optional]
    # A recipe whose ingredients aren't filled in yet would otherwise claim every diet.
    if not required:
        return []
    return [tag for tag in DietTag if all(_allows(ingredient, tag) for ingredient in required)]


def diet_tag_conflicts(lines: Iterable[IngredientLine]) -> list[DietTagConflict]:
    """Each optional ingredient that the recipe's diet tags don't allow, with the tags it would take away."""
    lines = list(lines)
    tags = diet_tags(lines)
    # Keyed by id, so an ingredient on two optional lines is named once.
    optional = {line.ingredient.pk: line.ingredient for line in lines if line.optional}
    conflicts = [
        DietTagConflict(ingredient, [tag for tag in tags if not _allows(ingredient, tag)])
        for ingredient in optional.values()
    ]
    return [conflict for conflict in conflicts if conflict.diet_tags]
