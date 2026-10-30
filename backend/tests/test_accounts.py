import re
import time
from collections.abc import Iterator
from typing import Any

import pytest
from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.http import HttpResponse
from pytest_django.fixtures import Settings
from rest_framework.test import APIClient

from households.models import Household, StoredSignInCode, User

AUTH = '/api/_allauth/browser/v1/auth'
CODE_SUBJECT = re.compile(r'Your Tastebook code is (\d{6})')
THIRTY_DAYS = 60 * 60 * 24 * 30


@pytest.fixture(autouse=True)
def no_rate_limits_carried_over() -> Iterator[None]:
    cache.clear()
    yield
    cache.clear()


class BrowserClient:
    """Calls allauth's browser API as the SPA does: session cookies, and the CSRF cookie sent back as a header."""

    def __init__(self) -> None:
        self.client = APIClient(enforce_csrf_checks=True)
        self.get('session')

    def csrf_header(self) -> dict[str, str]:
        return {'HTTP_X_CSRFTOKEN': self.client.cookies['csrftoken'].value}

    def get(self, path: str) -> HttpResponse:
        return self.client.get(f'{AUTH}/{path}')

    def post(self, path: str, body: dict[str, Any]) -> HttpResponse:
        return self.client.post(f'{AUTH}/{path}', body, format='json', **self.csrf_header())

    def delete(self, path: str) -> HttpResponse:
        return self.client.delete(f'{AUTH}/{path}', **self.csrf_header())


def emailed_code(to: str) -> str:
    sent = [message for message in mail.outbox if message.to == [to]]
    match = CODE_SUBJECT.fullmatch(sent[-1].subject)
    assert match, sent[-1].subject
    return match.group(1)


def pending_flow(response: HttpResponse) -> str | None:
    return next((flow['id'] for flow in response.json()['data']['flows'] if flow.get('is_pending')), None)


def sign_up(browser: BrowserClient, email: str) -> HttpResponse:
    browser.post('code/request', {'email': email})
    browser.post('signup', {'email': email})
    return browser.post('email/verify', {'key': emailed_code(email)})


def signed_in_email(browser: BrowserClient) -> str | None:
    response = browser.get('session')
    return response.json()['data']['user']['email'] if response.status_code == 200 else None


@pytest.mark.django_db
def test_a_new_address_signs_up_with_a_code_and_is_signed_in() -> None:
    browser = BrowserClient()

    requested = browser.post('code/request', {'email': 'sam@example.com'})
    signed_up = browser.post('signup', {'email': 'sam@example.com'})
    verified = browser.post('email/verify', {'key': emailed_code('sam@example.com')})

    assert (requested.status_code, requested.json()['errors'][0]['code']) == (400, 'unknown_email')
    assert (signed_up.status_code, pending_flow(signed_up)) == (401, 'verify_email')
    assert [message.to for message in mail.outbox] == [['sam@example.com']]
    assert verified.status_code == 200
    assert signed_in_email(browser) == 'sam@example.com'


@pytest.mark.django_db
def test_an_existing_account_signs_in_with_a_code() -> None:
    sign_up(BrowserClient(), 'sam@example.com')
    browser = BrowserClient()

    requested = browser.post('code/request', {'email': 'sam@example.com'})
    confirmed = browser.post('code/confirm', {'code': emailed_code('sam@example.com')})

    assert (requested.status_code, pending_flow(requested)) == (401, 'login_by_code')
    assert confirmed.status_code == 200
    assert signed_in_email(browser) == 'sam@example.com'


@pytest.mark.django_db
def test_the_code_email_comes_from_tastebook_and_says_how_long_the_code_works() -> None:
    browser = BrowserClient()
    browser.post('signup', {'email': 'sam@example.com'})

    [message] = mail.outbox
    code = emailed_code('sam@example.com')

    assert message.from_email == 'Tastebook <noreply@tastebook.dev>'
    assert f'\n{code}\n' in message.body
    assert 'It works once, for the next 10 minutes.' in message.body


@pytest.mark.django_db
def test_no_account_has_a_usable_password() -> None:
    sign_up(BrowserClient(), 'sam@example.com')

    signed_in = BrowserClient().post('login', {'email': 'sam@example.com', 'password': 'anything'})

    assert User.objects.get(email='sam@example.com').has_usable_password() is False
    assert signed_in.status_code != 200


@pytest.mark.django_db
def test_a_code_works_once() -> None:
    sign_up(BrowserClient(), 'sam@example.com')
    browser = BrowserClient()
    browser.post('code/request', {'email': 'sam@example.com'})
    code = emailed_code('sam@example.com')
    browser.post('code/confirm', {'code': code})
    browser.delete('session')

    again = browser.post('code/confirm', {'code': code})

    assert again.status_code != 200
    assert browser.get('session').status_code == 401


@pytest.mark.django_db
def test_a_wrong_code_is_refused() -> None:
    sign_up(BrowserClient(), 'sam@example.com')
    browser = BrowserClient()
    browser.post('code/request', {'email': 'sam@example.com'})
    wrong = '000000' if emailed_code('sam@example.com') != '000000' else '111111'

    refused = browser.post('code/confirm', {'code': wrong})

    assert (refused.status_code, refused.json()['errors'][0]['code']) == (400, 'incorrect_code')
    assert browser.get('session').status_code == 401


@pytest.mark.django_db
def test_the_limit_on_asking_for_codes_is_kept_in_the_database() -> None:
    sign_up(BrowserClient(), 'sam@example.com')

    BrowserClient().post('code/request', {'email': 'sam@example.com'})

    with connection.cursor() as cursor:
        cursor.execute('SELECT cache_key FROM django_cache')
        keys = [key for (key,) in cursor.fetchall() if 'request_login_code' in key]
    assert len(keys) == 2


SENT_AT = 1_800_000_000.0


def ask_for_codes(
    monkeypatch: pytest.MonkeyPatch, email: str, seconds_after_the_first: list[int]
) -> list[HttpResponse]:
    def ask(seconds: int) -> HttpResponse:
        monkeypatch.setattr(time, 'time', lambda: SENT_AT + seconds)
        return BrowserClient().post('code/request', {'email': email})

    return [ask(seconds) for seconds in seconds_after_the_first]


@pytest.mark.django_db
def test_an_address_is_sent_at_most_3_codes_in_10_minutes(monkeypatch: pytest.MonkeyPatch) -> None:
    sign_up(BrowserClient(), 'sam@example.com')
    sent_before = len(mail.outbox)

    answers = ask_for_codes(monkeypatch, 'sam@example.com', [0, 60, 120, 180])

    codes_sent = len([message for message in mail.outbox[sent_before:] if message.to == ['sam@example.com']])
    assert ([answer.status_code for answer in answers], answers[-1].get('Retry-After'), codes_sent) == (
        [401, 401, 401, 429],
        '420',
        3,
    )


@pytest.mark.django_db
@pytest.mark.parametrize(('seconds_later', 'status', 'retry_after'), [(599, 429, '1'), (600, 401, None)])
def test_a_4th_code_is_sent_once_the_first_is_10_minutes_old(
    monkeypatch: pytest.MonkeyPatch, seconds_later: int, status: int, retry_after: str | None
) -> None:
    sign_up(BrowserClient(), 'sam@example.com')

    *_, fourth = ask_for_codes(monkeypatch, 'sam@example.com', [0, 60, 120, seconds_later])

    assert (fourth.status_code, fourth.get('Retry-After')) == (status, retry_after)


@pytest.mark.django_db
def test_another_address_is_not_held_back_by_one_over_its_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    sign_up(BrowserClient(), 'sam@example.com')
    sign_up(BrowserClient(), 'kim@example.com')

    *_, sams_fourth = ask_for_codes(monkeypatch, 'sam@example.com', [0, 60, 120, 180])
    [kims_first] = ask_for_codes(monkeypatch, 'kim@example.com', [180])

    assert (sams_fourth.status_code, kims_first.status_code) == (429, 401)


@pytest.mark.django_db
def test_a_21st_sign_up_from_one_address_in_a_minute_is_told_when_to_try_again(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(time, 'time', lambda: SENT_AT)
    for number in range(20):
        BrowserClient().post('signup', {'email': f'cook{number}@example.com'})
    monkeypatch.setattr(time, 'time', lambda: SENT_AT + 15)

    refused = BrowserClient().post('signup', {'email': 'cook20@example.com'})

    assert (refused.status_code, refused.get('Retry-After')) == (429, '45')


def ask_to_sign_in(browser: BrowserClient, email: str) -> tuple[str, dict[str, str]]:
    sign_up(BrowserClient(), email)
    browser.post('code/request', {'email': email})
    return 'code/confirm', {'code': emailed_code(email)}


def ask_to_sign_up(browser: BrowserClient, email: str) -> tuple[str, dict[str, str]]:
    browser.post('signup', {'email': email})
    return 'email/verify', {'key': emailed_code(email)}


@pytest.mark.django_db
@pytest.mark.parametrize('ask', [ask_to_sign_in, ask_to_sign_up], ids=['sign-in', 'sign-up'])
@pytest.mark.parametrize(('seconds_later', 'status'), [(599, 200), (601, None)])
def test_a_code_works_for_10_minutes(
    monkeypatch: pytest.MonkeyPatch, ask: Any, seconds_later: int, status: int | None
) -> None:
    browser = BrowserClient()
    sent_at = time.time()
    monkeypatch.setattr(time, 'time', lambda: sent_at)
    path, body = ask(browser, 'sam@example.com')
    monkeypatch.setattr(time, 'time', lambda: sent_at + seconds_later)

    confirmed = browser.post(path, body)

    if status == 200:
        assert (confirmed.status_code, signed_in_email(browser)) == (200, 'sam@example.com')
    else:
        assert confirmed.status_code != 200
        assert browser.get('session').status_code == 401


def wrong_code(body: dict[str, str]) -> dict[str, str]:
    [(field, code)] = body.items()
    return {field: '000000' if code != '000000' else '111111'}


@pytest.mark.django_db
@pytest.mark.parametrize('ask', [ask_to_sign_in, ask_to_sign_up], ids=['sign-in', 'sign-up'])
def test_the_5th_wrong_code_stops_the_code(ask: Any) -> None:
    browser = BrowserClient()
    path, body = ask(browser, 'sam@example.com')

    statuses = [browser.post(path, wrong_code(body)).status_code for _ in range(5)]
    right = browser.post(path, body)

    assert [*statuses, right.status_code] == [400, 400, 400, 400, 409, 409]
    assert browser.get('session').status_code == 401


@pytest.mark.django_db
@pytest.mark.parametrize('ask', [ask_to_sign_in, ask_to_sign_up], ids=['sign-in', 'sign-up'])
def test_the_right_code_still_works_after_4_wrong_ones(ask: Any) -> None:
    browser = BrowserClient()
    path, body = ask(browser, 'sam@example.com')

    statuses = [browser.post(path, wrong_code(body)).status_code for _ in range(4)]
    right = browser.post(path, body)

    assert [*statuses, right.status_code] == [400, 400, 400, 400, 200]
    assert signed_in_email(browser) == 'sam@example.com'


@pytest.mark.django_db
def test_a_session_lasts_30_days_from_the_last_request() -> None:
    browser = BrowserClient()

    verified = sign_up(browser, 'sam@example.com')
    later = browser.get('session')

    assert verified.cookies['sessionid']['max-age'] == THIRTY_DAYS
    assert later.status_code == 200
    assert later.cookies['sessionid']['max-age'] == THIRTY_DAYS


@pytest.mark.django_db
def test_signing_out_ends_the_session() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    signed_out = browser.delete('session')

    assert signed_out.status_code == 401
    assert browser.get('session').status_code == 401


def sign_up_outcome(response: HttpResponse) -> str | None:
    if response.status_code == 400:
        return response.json()['errors'][0]['message']
    return pending_flow(response)


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('enabled', 'expected'),
    [
        (False, (400, 'Addresses at tastebook.test are only for testing. Use your own email address.', False, None)),
        (True, (401, 'verify_email', True, True)),
    ],
    ids=['production', 'local-and-previews'],
)
def test_a_test_address_is_refused_on_production_and_has_its_code_stored_elsewhere(
    settings: Settings, enabled: bool, expected: tuple[int, str, bool, bool | None]
) -> None:
    settings.TEST_ACCOUNTS_ENABLED = enabled

    signed_up = BrowserClient().post('signup', {'email': 'cook@tastebook.test'})

    stored = StoredSignInCode.objects.filter(email='cook@tastebook.test').first()
    assert (
        signed_up.status_code,
        sign_up_outcome(signed_up),
        User.objects.filter(email='cook@tastebook.test').exists(),
        stored and bool(re.fullmatch(r'\d{6}', stored.code)),
    ) == expected
    assert mail.outbox == []


@pytest.mark.django_db
def test_the_current_account_is_null_with_a_200_for_a_visitor_and_sets_the_csrf_cookie() -> None:
    client = APIClient()

    response = client.get('/api/account/')

    assert (response.status_code, response.json()) == (200, {'account': None})
    assert client.cookies['csrftoken'].value != ''


@pytest.mark.django_db
def test_the_current_account_follows_signing_in_and_out() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    signed_in = browser.client.get('/api/account/')
    browser.delete('session')
    signed_out = browser.client.get('/api/account/')

    assert (signed_in.status_code, signed_in.json()) == (200, {'account': {'email': 'sam@example.com', 'name': ''}})
    assert (signed_out.status_code, signed_out.json()) == (200, {'account': None})


def save_name(browser: BrowserClient, name: str) -> HttpResponse:
    return browser.client.patch('/api/account/', {'name': name}, format='json', **browser.csrf_header())


@pytest.mark.django_db
def test_saving_a_name_makes_a_household_of_one() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    saved = save_name(browser, '  Milo ')
    current = browser.client.get('/api/account/')

    household = User.objects.get(email='sam@example.com').household
    assert (saved.status_code, saved.json()) == (200, {'email': 'sam@example.com', 'name': 'Milo'})
    assert current.json() == {'account': {'email': 'sam@example.com', 'name': 'Milo'}}
    assert household is not None
    assert (household.name, household.members.count()) == ("Milo's household", 1)


@pytest.mark.django_db
def test_two_accounts_get_a_household_each() -> None:
    sam = BrowserClient()
    sign_up(sam, 'sam@example.com')
    jo = BrowserClient()
    sign_up(jo, 'jo@example.com')

    save_name(sam, 'Milo')
    save_name(jo, 'Jo')

    assert set(Household.objects.values_list('name', flat=True)) == {"Milo's household", "Jo's household"}
    assert (
        User.objects.get(email='sam@example.com').household_id != User.objects.get(email='jo@example.com').household_id
    )


@pytest.mark.django_db
def test_saving_a_name_again_keeps_the_household_and_its_name() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    save_name(browser, 'Milo')
    save_name(browser, 'Milo Bedini')

    assert User.objects.get(email='sam@example.com').name == 'Milo Bedini'
    assert list(Household.objects.values_list('name', flat=True)) == ["Milo's household"]


@pytest.mark.django_db
@pytest.mark.parametrize('name', ['', '   ', 'a' * 51])
def test_a_blank_or_too_long_name_is_refused(name: str) -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    refused = save_name(browser, name)
    current = browser.client.get('/api/account/')

    assert (refused.status_code, 'name' in refused.json()) == (400, True)
    assert current.json() == {'account': {'email': 'sam@example.com', 'name': ''}}
    assert Household.objects.count() == 0


@pytest.mark.django_db
def test_a_name_of_fifty_characters_is_saved() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    saved = save_name(browser, 'a' * 50)

    assert (saved.status_code, saved.json()) == (200, {'email': 'sam@example.com', 'name': 'a' * 50})


@pytest.mark.django_db
def test_a_visitor_who_isnt_signed_in_cant_save_a_name() -> None:
    browser = BrowserClient()

    refused = save_name(browser, 'Milo')

    assert refused.status_code == 403
    assert Household.objects.count() == 0


@pytest.mark.django_db
def test_saving_a_name_without_the_csrf_header_is_refused() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    refused = browser.client.patch('/api/account/', {'name': 'Milo'}, format='json')

    assert refused.status_code == 403
    assert User.objects.get(email='sam@example.com').name == ''
