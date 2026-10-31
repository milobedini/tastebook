from typing import Any

import pytest
from django.http import HttpResponse

from households.models import Household, User
from tests.test_accounts import BrowserClient, save_name, sign_up

HOUSEHOLD = '/api/household/'


def signed_up(email: str, name: str) -> BrowserClient:
    browser = BrowserClient()
    sign_up(browser, email)
    save_name(browser, name)
    return browser


def rename(browser: BrowserClient, body: dict[str, Any]) -> HttpResponse:
    return browser.client.patch(HOUSEHOLD, body, format='json', **browser.csrf_header())


def join(email: str, household_of: str) -> None:
    # Joining doesn't exist yet, so the test moves the account itself.
    User.objects.filter(email=email).update(household=User.objects.get(email=household_of).household)


@pytest.mark.django_db
def test_a_new_account_sees_its_household_of_one() -> None:
    milo = signed_up('sam@example.com', 'Milo')

    response = milo.client.get(HOUSEHOLD)

    assert (response.status_code, response.json()) == (
        200,
        {
            'name': "Milo's household",
            'members': [{'id': User.objects.get(email='sam@example.com').pk, 'name': 'Milo', 'is_you': True}],
        },
    )


@pytest.mark.django_db
def test_members_come_you_first_then_by_name() -> None:
    milo = signed_up('milo@example.com', 'Milo')
    signed_up('zoe@example.com', 'zoe')
    signed_up('ann@example.com', 'Ann')
    join('zoe@example.com', 'milo@example.com')
    join('ann@example.com', 'milo@example.com')

    members = milo.client.get(HOUSEHOLD).json()['members']

    assert [member['name'] for member in members] == ['Milo', 'Ann', 'zoe']
    assert [member['is_you'] for member in members] == [True, False, False]
    assert [sorted(member) for member in members] == [['id', 'is_you', 'name']] * 3


@pytest.mark.django_db
def test_each_account_sees_only_its_own_household() -> None:
    signed_up('milo@example.com', 'Milo')
    jo = signed_up('jo@example.com', 'Jo')

    response = jo.client.get(HOUSEHOLD)

    assert response.json() == {
        'name': "Jo's household",
        'members': [{'id': User.objects.get(email='jo@example.com').pk, 'name': 'Jo', 'is_you': True}],
    }


@pytest.mark.django_db
def test_any_member_renames_the_household() -> None:
    milo = signed_up('milo@example.com', 'Milo')
    ann = signed_up('ann@example.com', 'Ann')
    join('ann@example.com', 'milo@example.com')

    renamed = rename(milo, {'name': '  The Bedinis '})
    seen_by_ann = ann.client.get(HOUSEHOLD)

    assert (renamed.status_code, renamed.json()['name']) == (200, 'The Bedinis')
    assert User.objects.get(email='milo@example.com').household.name == 'The Bedinis'
    assert seen_by_ann.json()['name'] == 'The Bedinis'


@pytest.mark.django_db
@pytest.mark.parametrize('body', [{}, {'name': ''}, {'name': '   '}, {'name': 'a' * 101}])
def test_a_missing_blank_or_long_name_is_refused(body: dict[str, Any]) -> None:
    milo = signed_up('milo@example.com', 'Milo')

    response = rename(milo, body)

    assert (response.status_code, 'name' in response.json()) == (400, True)
    assert Household.objects.get().name == "Milo's household"


@pytest.mark.django_db
def test_a_name_of_100_characters_is_saved() -> None:
    milo = signed_up('milo@example.com', 'Milo')

    response = rename(milo, {'name': 'a' * 100})

    assert (response.status_code, response.json()['name']) == (200, 'a' * 100)


@pytest.mark.django_db
@pytest.mark.parametrize('method', ['get', 'patch'])
def test_a_visitor_is_refused(method: str) -> None:
    signed_up('milo@example.com', 'Milo')
    visitor = BrowserClient()

    response = getattr(visitor.client, method)(HOUSEHOLD, {'name': 'Taken'}, format='json', **visitor.csrf_header())

    assert response.status_code == 403
    assert Household.objects.get().name == "Milo's household"


@pytest.mark.django_db
def test_an_account_with_no_household_gets_404() -> None:
    browser = BrowserClient()
    sign_up(browser, 'sam@example.com')

    assert browser.client.get(HOUSEHOLD).status_code == 404


@pytest.mark.django_db
def test_renaming_without_the_csrf_header_is_refused() -> None:
    milo = signed_up('milo@example.com', 'Milo')

    response = milo.client.patch(HOUSEHOLD, {'name': 'The Bedinis'}, format='json')

    assert response.status_code == 403
    assert Household.objects.get().name == "Milo's household"
