import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

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
    'TEST_ACCOUNTS_ENABLED': settings.TEST_ACCOUNTS_ENABLED,
    'TEST_ACCOUNT_CODES_NEED_SECRET': settings.TEST_ACCOUNT_CODES_NEED_SECRET,
    'MAILERS': settings.MAILERS,
    'DEFAULT_FROM_EMAIL': settings.DEFAULT_FROM_EMAIL,
}))
"""


def read_settings(env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    # Settings are read once per process, so each environment gets its own.
    return subprocess.run(
        [sys.executable, '-c', READ_SETTINGS],
        cwd=BACKEND,
        env={'PATH': os.environ['PATH'], 'DJANGO_SETTINGS_MODULE': 'config.settings', **env},
        capture_output=True,
        text=True,
        check=False,
    )


def settings_with(env: dict[str, str]) -> dict[str, object]:
    result = read_settings(env)
    result.check_returncode()
    return json.loads(result.stdout)


def test_a_vercel_deployment_trusts_its_own_hosts_and_no_others() -> None:
    settings = settings_with(
        {
            'DJANGO_SECRET_KEY': 'test-only',
            'VERCEL_URL': 'tastebook-abc123-milobedinis-projects.vercel.app',
            'VERCEL_BRANCH_URL': 'tastebook-git-tas-24-milobedinis-projects.vercel.app',
            'VERCEL_PROJECT_PRODUCTION_URL': 'tastebook.dev',
        }
    )

    assert settings['ALLOWED_HOSTS'] == [
        'localhost',
        '127.0.0.1',
        'tastebook-abc123-milobedinis-projects.vercel.app',
        'tastebook-git-tas-24-milobedinis-projects.vercel.app',
        'tastebook.dev',
    ]
    assert settings['CSRF_TRUSTED_ORIGINS'] == [
        'https://tastebook-abc123-milobedinis-projects.vercel.app',
        'https://tastebook-git-tas-24-milobedinis-projects.vercel.app',
        'https://tastebook.dev',
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


@pytest.mark.parametrize(
    ('env', 'expected'),
    [
        ({'DJANGO_DEBUG': 'true'}, (True, False)),
        ({'DJANGO_SECRET_KEY': 'test-only', 'VERCEL_ENV': 'preview'}, (True, True)),
        ({'DJANGO_SECRET_KEY': 'test-only', 'VERCEL_ENV': 'production', 'RESEND_API_KEY': 're_test'}, (False, True)),
    ],
    ids=['local', 'preview', 'production'],
)
def test_test_accounts_are_open_locally_need_the_secret_on_previews_and_are_off_on_production(
    env: dict[str, str], expected: tuple[bool, bool]
) -> None:
    settings = settings_with(env)

    assert (settings['TEST_ACCOUNTS_ENABLED'], settings['TEST_ACCOUNT_CODES_NEED_SECRET']) == expected


def test_production_sends_email_through_resend_from_tastebook() -> None:
    settings = settings_with(
        {'DJANGO_SECRET_KEY': 'test-only', 'VERCEL_ENV': 'production', 'RESEND_API_KEY': 're_test'}
    )

    assert settings['MAILERS'] == {
        'default': {
            'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
            'OPTIONS': {
                'host': 'smtp.resend.com',
                'port': 465,
                'use_ssl': True,
                'username': 'resend',
                'password': 're_test',
                'timeout': 10,
            },
        }
    }
    assert settings['DEFAULT_FROM_EMAIL'] == 'Tastebook <noreply@tastebook.dev>'


def test_a_preview_sends_no_email() -> None:
    settings = settings_with({'DJANGO_SECRET_KEY': 'test-only', 'VERCEL_ENV': 'preview'})

    assert settings['MAILERS'] == {'default': {'BACKEND': 'django.core.mail.backends.dummy.EmailBackend'}}


def test_production_without_the_resend_key_does_not_start() -> None:
    result = read_settings({'DJANGO_SECRET_KEY': 'test-only', 'VERCEL_ENV': 'production'})

    assert result.returncode != 0
    assert 'RESEND_API_KEY must be set on production' in result.stderr
