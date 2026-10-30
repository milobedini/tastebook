from collections.abc import Iterator

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder

import build
from recipes.models import Recipe


@pytest.fixture
def an_empty_database() -> Iterator[None]:
    with connection.cursor() as cursor:
        cursor.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
    yield
    with connection.cursor() as cursor:
        cursor.execute('COMMENT ON SCHEMA public IS NULL')


@pytest.mark.django_db
def test_a_preview_built_on_a_database_with_an_account_fails_before_loading_the_catalogue(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv('VERCEL_ENV', 'preview')
    get_user_model().objects.create_user(email='someone@example.com')

    with pytest.raises(SystemExit) as failure:
        build.main()

    assert (str(failure.value), Recipe.objects.count()) == (
        "This preview's database holds accounts, so it was made from production's. "
        'Previews must be made from the catalogue-only branch: see docs/architecture.md, Environments.',
        0,
    )


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('environment', 'accounts'),
    [('preview', 0), ('production', 1), (None, 1)],
)
def test_a_build_loads_the_catalogue_unless_it_is_a_preview_holding_accounts(
    monkeypatch: pytest.MonkeyPatch, environment: str | None, accounts: int
) -> None:
    if environment is None:
        monkeypatch.delenv('VERCEL_ENV', raising=False)
    else:
        monkeypatch.setenv('VERCEL_ENV', environment)
    for number in range(accounts):
        get_user_model().objects.create_user(email=f'cook{number}@example.com')

    build.main()

    assert (Recipe.objects.count(), get_user_model().objects.count()) == (305, accounts)


@pytest.mark.django_db(transaction=True)
def test_a_preview_born_empty_keeps_its_own_accounts_on_the_next_build(
    monkeypatch: pytest.MonkeyPatch, an_empty_database: None
) -> None:
    monkeypatch.setenv('VERCEL_ENV', 'preview')
    build.main()
    get_user_model().objects.create_user(email='someone@example.com')

    build.main()

    assert (Recipe.objects.count(), get_user_model().objects.count()) == (305, 1)


@pytest.fixture
def a_database_migrated_before_the_switch(an_empty_database: None) -> Iterator[None]:
    # As production and older previews are: the admin migrated against auth.User, with its log and auth_user empty.
    recorder = MigrationRecorder(connection)
    recorder.ensure_schema()
    for name in ('0001_initial', '0002_logentry_remove_auto_add', '0003_logentry_add_action_flag_choices'):
        recorder.record_applied('admin', name)
    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE django_admin_log (id serial PRIMARY KEY)')
        cursor.execute('CREATE TABLE auth_user (id serial PRIMARY KEY)')
    yield
    # A refused build leaves no schema behind, and pytest-django needs one to flush the database after the test.
    if ('households', '0001_initial') not in recorder.applied_migrations():
        with connection.cursor() as cursor:
            cursor.execute('TRUNCATE django_admin_log, auth_user')
        build.switch_to_the_custom_user()
        call_command('migrate', interactive=False, verbosity=0)


@pytest.mark.django_db(transaction=True)
def test_a_build_switches_a_database_migrated_before_the_custom_user_to_it(
    monkeypatch: pytest.MonkeyPatch, a_database_migrated_before_the_switch: None
) -> None:
    monkeypatch.delenv('VERCEL_ENV', raising=False)

    build.main()

    applied = MigrationRecorder(connection).applied_migrations()
    get_user_model().objects.create_user(email='sam@example.com')
    assert (
        Recipe.objects.count(),
        ('households', '0001_initial') in applied,
        ('admin', '0001_initial') in applied,
        get_user_model().objects.count(),
    ) == (305, True, True, 1)


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize('table', ['django_admin_log', 'auth_user'])
def test_a_build_refuses_the_switch_when_the_tables_it_drops_hold_rows(
    monkeypatch: pytest.MonkeyPatch, a_database_migrated_before_the_switch: None, table: str
) -> None:
    monkeypatch.delenv('VERCEL_ENV', raising=False)
    with connection.cursor() as cursor:
        cursor.execute(f'INSERT INTO {table} DEFAULT VALUES')

    with pytest.raises(SystemExit) as failure:
        build.main()

    assert (
        str(failure.value),
        ('households', '0001_initial') in MigrationRecorder(connection).applied_migrations(),
    ) == (
        "The admin's log or the old auth_user table holds rows, so the switch to households.User can't drop them. "
        'Keep what they hold elsewhere, empty them, and deploy again: see specs/TAS-102.md.',
        False,
    )
