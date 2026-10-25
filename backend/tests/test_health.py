import re
from collections.abc import Iterator
from pathlib import Path

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from health import services


@pytest.fixture(autouse=True)
def fresh_api_version() -> Iterator[None]:
    services.api_version.cache_clear()
    yield
    services.api_version.cache_clear()


@pytest.mark.django_db
def test_health_reports_ok_with_a_live_database_and_the_api_version() -> None:
    response = APIClient().get(reverse('health'))

    assert response.status_code == 200
    body = response.json()
    assert {'status': body['status'], 'database': body['database']} == {'status': 'ok', 'database': 'ok'}
    # Matches any release, so bumping the version in pyproject.toml doesn't break this test.
    assert re.fullmatch(r'\d+(\.\d+)+', body['version'])


@pytest.mark.django_db
def test_health_reports_the_version_declared_in_pyproject(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    pyproject = tmp_path / 'pyproject.toml'
    pyproject.write_text('[project]\nname = "tastebook-backend"\nversion = "2.3.4"\n')
    monkeypatch.setattr(services, 'PYPROJECT_PATH', pyproject)

    response = APIClient().get(reverse('health'))

    assert response.json() == {'status': 'ok', 'database': 'ok', 'version': '2.3.4'}
