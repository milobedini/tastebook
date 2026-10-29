"""Vercel's build step for the API: brings this deployment's database and catalogue up to date before it goes live."""

import os

import django
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection

PREVIEW_HOLDS_ACCOUNTS = (
    "This preview's database holds accounts, so it was made from production's. "
    'Previews must be made from the catalogue-only branch: see docs/architecture.md, Environments.'
)
BORN_EMPTY = 'Tastebook preview database, born empty'


def is_empty() -> bool:
    return 'django_migrations' not in connection.introspection.table_names()


def mark_born_empty() -> None:
    # A Neon branch copies the schema's comment, and production's never has this one, so the mark can't arrive from it.
    with connection.cursor() as cursor:
        cursor.execute(f"COMMENT ON SCHEMA public IS '{BORN_EMPTY}'")


def was_born_empty() -> bool:
    with connection.cursor() as cursor:
        cursor.execute("SELECT obj_description('public'::regnamespace, 'pg_namespace')")
        return cursor.fetchone()[0] == BORN_EMPTY


def refuse_a_preview_with_accounts() -> None:
    # Households and private recipes belong to accounts, so a database with no accounts holds none of them either.
    # A preview born empty holds only its own accounts, made on the preview since.
    if not was_born_empty() and get_user_model().objects.exists():
        raise SystemExit(PREVIEW_HOLDS_ACCOUNTS)


def main() -> None:
    # Migrations take Neon's direct connection; the pooled one is for requests.
    unpooled = os.environ.get('DATABASE_URL_UNPOOLED')
    if unpooled:
        os.environ['DATABASE_URL'] = unpooled
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    is_preview = os.environ.get('VERCEL_ENV') == 'preview'
    # Marked before migrating, so a build that fails part-way still leaves the mark for the next push's build.
    if is_preview and is_empty():
        mark_born_empty()
    call_command('migrate', interactive=False)
    if is_preview:
        refuse_a_preview_with_accounts()
    # A catalogue file the database can't hold fails the build, so the deployment never goes live without it.
    call_command('load_catalogue')


if __name__ == '__main__':
    main()
