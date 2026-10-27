from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser

from recipes.services import CATALOGUE_PATH, CatalogueError, load_catalogue


class Command(BaseCommand):
    help = 'Makes the catalogue (its recipes, ingredients and equipment) what the catalogue file says.'

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            'path', nargs='?', type=Path, default=CATALOGUE_PATH, help='Defaults to the file in the repo.'
        )

    def handle(self, *args: Any, path: Path, **options: Any) -> None:
        try:
            loaded = load_catalogue(path)
        except CatalogueError as error:
            raise CommandError(str(error)) from error
        self.stdout.write(
            f'Loaded the catalogue: {loaded.recipes} recipes, {loaded.ingredients} ingredients '
            f'and {loaded.equipment} pieces of equipment.'
        )
