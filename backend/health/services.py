import tomllib
from functools import cache

from django.conf import settings

# The backend isn't installed as a package (no [build-system]), so importlib.metadata can't see it.
PYPROJECT_PATH = settings.BASE_DIR / 'pyproject.toml'


@cache
def api_version() -> str:
    with PYPROJECT_PATH.open('rb') as pyproject:
        return tomllib.load(pyproject)['project']['version']
