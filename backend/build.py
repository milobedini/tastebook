"""Vercel's build step for the API: brings this deployment's database up to date before the deployment goes live."""

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


if __name__ == '__main__':
    main()
