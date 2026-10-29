"""Vercel's build step for the API: brings this deployment's database and catalogue up to date before it goes live."""

import os

import django
from django.contrib.auth import get_user_model
from django.core.management import call_command

PREVIEW_HOLDS_ACCOUNTS = (
    "This preview's database holds accounts, so it was made from production's. "
    'Previews must be made from the catalogue-only branch: see docs/architecture.md, Environments.'
)


def refuse_a_preview_with_accounts() -> None:
    # Households and private recipes belong to accounts, so a database with no accounts holds none of them either.
    if os.environ.get('VERCEL_ENV') == 'preview' and get_user_model().objects.exists():
        raise SystemExit(PREVIEW_HOLDS_ACCOUNTS)


def main() -> None:
    # Migrations take Neon's direct connection; the pooled one is for requests.
    unpooled = os.environ.get('DATABASE_URL_UNPOOLED')
    if unpooled:
        os.environ['DATABASE_URL'] = unpooled
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    call_command('migrate', interactive=False)
    refuse_a_preview_with_accounts()
    # A catalogue file the database can't hold fails the build, so the deployment never goes live without it.
    call_command('load_catalogue')


if __name__ == '__main__':
    main()
