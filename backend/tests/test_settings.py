import json
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent

READ_SETTINGS = """
import json
from django.conf import settings
print(json.dumps({
    'ALLOWED_HOSTS': settings.ALLOWED_HOSTS,
    'CSRF_TRUSTED_ORIGINS': settings.CSRF_TRUSTED_ORIGINS,
    'SESSION_COOKIE_SECURE': settings.SESSION_COOKIE_SECURE,
    'CSRF_COOKIE_SECURE': settings.CSRF_COOKIE_SECURE,
    'SECURE_PROXY_SSL_HEADER': settings.SECURE_PROXY_SSL_HEADER,
}))
"""


def settings_with(env: dict[str, str]) -> dict[str, object]:
    # Settings are read once per process, so each environment gets its own.
    result = subprocess.run(
        [sys.executable, '-c', READ_SETTINGS],
        cwd=BACKEND,
        env={'PATH': os.environ['PATH'], 'DJANGO_SETTINGS_MODULE': 'config.settings', **env},
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def test_a_vercel_deployment_trusts_its_own_hosts_and_no_others() -> None:
    settings = settings_with(
        {
            'DJANGO_SECRET_KEY': 'test-only',
            'VERCEL_URL': 'tastebook-abc123-milobedinis-projects.vercel.app',
            'VERCEL_BRANCH_URL': 'tastebook-git-tas-24-milobedinis-projects.vercel.app',
            'VERCEL_PROJECT_PRODUCTION_URL': 'tastebook.vercel.app',
        }
    )

    assert settings['ALLOWED_HOSTS'] == [
        'localhost',
        '127.0.0.1',
        'tastebook-abc123-milobedinis-projects.vercel.app',
        'tastebook-git-tas-24-milobedinis-projects.vercel.app',
        'tastebook.vercel.app',
    ]
    assert settings['CSRF_TRUSTED_ORIGINS'] == [
        'https://tastebook-abc123-milobedinis-projects.vercel.app',
        'https://tastebook-git-tas-24-milobedinis-projects.vercel.app',
        'https://tastebook.vercel.app',
    ]


def test_production_sends_cookies_over_https_only_behind_the_proxy() -> None:
    settings = settings_with({'DJANGO_SECRET_KEY': 'test-only'})

    assert settings['SESSION_COOKIE_SECURE'] is True
    assert settings['CSRF_COOKIE_SECURE'] is True
    assert settings['SECURE_PROXY_SSL_HEADER'] == ['HTTP_X_FORWARDED_PROTO', 'https']


def test_local_development_trusts_only_localhost() -> None:
    settings = settings_with({'DJANGO_DEBUG': 'true'})

    assert settings['ALLOWED_HOSTS'] == ['localhost', '127.0.0.1']
    assert settings['CSRF_TRUSTED_ORIGINS'] == []
    assert settings['SESSION_COOKIE_SECURE'] is False
