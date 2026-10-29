import pytest
from django.contrib.auth import get_user_model

import build
from recipes.models import Recipe


@pytest.mark.django_db
def test_a_preview_built_on_a_database_with_an_account_fails_before_loading_the_catalogue(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv('VERCEL_ENV', 'preview')
    get_user_model().objects.create_user(username='someone', email='someone@example.com')

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
        get_user_model().objects.create_user(username=f'cook{number}')

    build.main()

    assert (Recipe.objects.count(), get_user_model().objects.count()) == (305, accounts)
