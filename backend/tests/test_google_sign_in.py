import time
from typing import Any
from urllib.parse import parse_qs, urlsplit

import jwt
import pytest
import responses
from allauth.socialaccount.models import SocialAccount
from django.http import HttpResponse
from pytest_django.fixtures import Settings

from households.models import User
from tests.test_accounts import AUTH, BrowserClient, save_name, sign_up, signed_in_email

CLIENT_ID = 'tastebook.apps.googleusercontent.com'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
CALLBACK = '/api/accounts/google/login/callback/'
BACK_TO_SIGN_IN = '/sign-in?next=%2Frecipes'


@pytest.fixture(autouse=True)
def google_client(settings: Settings) -> None:
    settings.SOCIALACCOUNT_PROVIDERS = {
        'google': {'APPS': [{'client_id': CLIENT_ID, 'secret': 'test-only'}], 'SCOPE': ['profile', 'email']}
    }


def google_profile(**claims: Any) -> dict[str, Any]:
    return {
        'sub': '1234567890',
        'email': 'milo@example.com',
        'email_verified': True,
        'given_name': 'Milo',
        'family_name': 'Bedini',
        'name': 'Milo Bedini',
        'picture': 'https://lh3.googleusercontent.com/a/photo',
        **claims,
    }


def id_token(profile: dict[str, Any]) -> str:
    now = int(time.time())
    claims = {'iss': 'https://accounts.google.com', 'aud': CLIENT_ID, 'iat': now, 'exp': now + 3600, **profile}
    # allauth skips the signature of a token it fetched from Google itself, over TLS.
    return jwt.encode(claims, 'a-key-allauth-does-not-check-on-this-path', algorithm='HS256')


def go_to_google(browser: BrowserClient, callback_url: str = BACK_TO_SIGN_IN) -> HttpResponse:
    """Presses Continue with Google: the page posts a form to allauth, which sends the browser to Google."""
    return browser.client.post(
        f'{AUTH}/provider/redirect',
        {
            'provider': 'google',
            'process': 'login',
            'callback_url': callback_url,
            'csrfmiddlewaretoken': browser.client.cookies['csrftoken'].value,
        },
    )


def sign_in_with_google(browser: BrowserClient, profile: dict[str, Any]) -> HttpResponse:
    """The whole round trip, with Google's token endpoint answering for the person in `profile`."""
    to_google = go_to_google(browser)
    state = parse_qs(urlsplit(to_google['Location']).query)['state'][0]
    with responses.RequestsMock() as google:
        google.post(
            GOOGLE_TOKEN_URL,
            json={'access_token': 'access', 'token_type': 'Bearer', 'expires_in': 3600, 'id_token': id_token(profile)},
        )
        return browser.client.get(CALLBACK, {'code': 'from-google', 'state': state})


def current_account(browser: BrowserClient) -> dict[str, str] | None:
    return browser.client.get('/api/account/').json()['account']


@pytest.mark.django_db
def test_google_is_offered_only_when_its_client_is_set_up(settings: Settings) -> None:
    browser = BrowserClient()
    with_client = browser.client.get('/api/_allauth/browser/v1/config').json()
    settings.SOCIALACCOUNT_PROVIDERS = {'google': {'APPS': []}}
    without_client = browser.client.get('/api/_allauth/browser/v1/config').json()

    assert [provider['id'] for provider in with_client['data']['socialaccount']['providers']] == ['google']
    assert without_client['data']['socialaccount']['providers'] == []


@pytest.mark.django_db
def test_continuing_with_google_sends_the_browser_to_google_with_tastebooks_callback() -> None:
    to_google = go_to_google(BrowserClient())

    location = urlsplit(to_google['Location'])
    query = parse_qs(location.query)
    assert to_google.status_code == 302
    assert f'{location.scheme}://{location.netloc}{location.path}' == 'https://accounts.google.com/o/oauth2/v2/auth'
    assert query['client_id'] == [CLIENT_ID]
    assert query['redirect_uri'] == [f'http://testserver{CALLBACK}']
    assert set(query['scope'][0].split()) == {'profile', 'email'}


@pytest.mark.django_db
def test_continuing_with_google_refuses_a_callback_on_another_site() -> None:
    refused = go_to_google(BrowserClient(), callback_url='https://evil.example/sign-in')

    assert 'accounts.google.com' not in refused.get('Location', '')


@pytest.mark.django_db
def test_a_new_address_signs_up_with_google_named_from_its_profile_in_a_household_of_one() -> None:
    browser = BrowserClient()

    back = sign_in_with_google(browser, google_profile())

    account = User.objects.get(email='milo@example.com')
    assert (back.status_code, back['Location']) == (302, BACK_TO_SIGN_IN)
    assert signed_in_email(browser) == 'milo@example.com'
    assert current_account(browser) == {'email': 'milo@example.com', 'name': 'Milo'}
    assert account.household is not None
    assert account.household.name == "Milo's household"


@pytest.mark.django_db
def test_an_address_with_an_account_signs_in_to_that_account_with_google() -> None:
    sam = BrowserClient()
    sign_up(sam, 'sam@example.com')
    save_name(sam, 'Sam')
    browser = BrowserClient()

    sign_in_with_google(browser, google_profile(email='SAM@example.com', given_name='Samantha'))

    assert list(User.objects.values_list('email', 'name')) == [('sam@example.com', 'Sam')]
    assert current_account(browser) == {'email': 'sam@example.com', 'name': 'Sam'}


@pytest.mark.django_db
def test_signing_in_with_google_again_signs_in_to_the_same_account() -> None:
    sign_in_with_google(BrowserClient(), google_profile())
    browser = BrowserClient()

    sign_in_with_google(browser, google_profile(email='milo@example.com'))

    assert User.objects.count() == 1
    assert signed_in_email(browser) == 'milo@example.com'


@pytest.mark.django_db
def test_an_address_that_never_finished_signing_up_signs_in_with_google() -> None:
    BrowserClient().post('signup', {'email': 'kim@example.com'})
    browser = BrowserClient()

    sign_in_with_google(browser, google_profile(email='kim@example.com', given_name='Kim'))

    assert User.objects.filter(email='kim@example.com').count() == 1
    assert signed_in_email(browser) == 'kim@example.com'


@pytest.mark.django_db
@pytest.mark.parametrize('given_name', [None, '', 'A' * 51], ids=['missing', 'blank', 'too-long'])
def test_without_a_first_name_that_fits_a_google_sign_up_is_left_for_the_name_page(given_name: str | None) -> None:
    browser = BrowserClient()

    sign_in_with_google(browser, google_profile(given_name=given_name))

    assert current_account(browser) == {'email': 'milo@example.com', 'name': ''}
    assert User.objects.get(email='milo@example.com').household is None


@pytest.mark.django_db
def test_an_address_google_has_not_verified_is_sent_back_with_an_error_and_makes_no_account() -> None:
    browser = BrowserClient()

    back = sign_in_with_google(browser, google_profile(email_verified=False))

    assert (back.status_code, back['Location']) == (
        302,
        f'{BACK_TO_SIGN_IN}&error=unverified_email&error_process=login',
    )
    assert signed_in_email(browser) is None
    assert User.objects.count() == 0


@pytest.mark.django_db
def test_an_unverified_google_address_does_not_sign_in_to_its_account() -> None:
    sign_up(BrowserClient(), 'sam@example.com')
    browser = BrowserClient()

    sign_in_with_google(browser, google_profile(email='sam@example.com', email_verified=False))

    assert signed_in_email(browser) is None
    assert SocialAccount.objects.count() == 0


@pytest.mark.django_db
def test_a_google_account_keeps_only_the_profile_sign_in_uses() -> None:
    sign_in_with_google(BrowserClient(), google_profile())

    [google_account] = SocialAccount.objects.all()

    assert google_account.extra_data == {'email': 'milo@example.com', 'email_verified': True, 'given_name': 'Milo'}


@pytest.mark.django_db
def test_returning_from_google_without_a_known_state_lands_on_the_sign_in_page_with_an_error() -> None:
    back = BrowserClient().client.get(CALLBACK, {'code': 'from-google', 'state': 'not-ours'})

    location = urlsplit(back['Location'])
    assert (back.status_code, location.path, parse_qs(location.query)['error']) == (302, '/sign-in', ['unknown'])
