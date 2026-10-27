"""Vercel's build step for the API: brings this deployment's database and catalogue up to date before it goes live."""

import os

import django
from django.core.management import call_command


def main() -> None:
    # Migrations take Neon's direct connection; the pooled one is for requests.
    unpooled = os.environ.get('DATABASE_URL_UNPOOLED')
    if unpooled:
        os.environ['DATABASE_URL'] = unpooled
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    call_command('migrate', interactive=False)
    # A catalogue file the database can't hold fails the build, so the deployment never goes live without it.
    call_command('load_catalogue')


if __name__ == '__main__':
    main()
