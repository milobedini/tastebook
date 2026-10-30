from io import StringIO

import pytest
from allauth.mfa.models import Authenticator
from django.core.management import call_command
from django.core.management.base import CommandError

from households.models import User


def run(command: str, email: str) -> str:
    output = StringIO()
    call_command(command, email, stdout=output)
    return output.getvalue().strip()


@pytest.mark.django_db
def test_make_staff_makes_an_existing_account_staff_and_superuser() -> None:
    User.objects.create_user('sam@example.com')

    output = run('make_staff', 'Sam@Example.com')

    account = User.objects.get(email='sam@example.com')
    assert (account.is_staff, account.is_superuser) == (True, True)
    assert output == 'Sam@Example.com is now staff. Open /admin/ to set up two-factor sign-in.'


@pytest.mark.parametrize('command', ['make_staff', 'reset_two_factor'])
@pytest.mark.django_db
def test_the_staff_commands_refuse_an_address_with_no_account(command: str) -> None:
    with pytest.raises(CommandError) as error:
        run(command, 'nobody@example.com')

    assert str(error.value) == 'No account uses nobody@example.com. Sign up in the app with it first.'


@pytest.mark.django_db
def test_reset_two_factor_says_so_when_the_account_has_no_authenticator() -> None:
    User.objects.create_user('sam@example.com', is_staff=True)

    assert run('reset_two_factor', 'sam@example.com') == 'sam@example.com has no authenticator.'


@pytest.mark.django_db
def test_reset_two_factor_leaves_other_accounts_authenticators() -> None:
    sam = User.objects.create_user('sam@example.com', is_staff=True)
    alex = User.objects.create_user('alex@example.com', is_staff=True)
    for account in (sam, alex):
        Authenticator.objects.create(user=account, type=Authenticator.Type.TOTP, data={})
        Authenticator.objects.create(user=account, type=Authenticator.Type.RECOVERY_CODES, data={})

    output = run('reset_two_factor', 'sam@example.com')

    assert output == (
        "Removed sam@example.com's authenticator and recovery codes. "
        'They set up a new one the next time they open /admin/.'
    )
    assert list(Authenticator.objects.values_list('user__email', flat=True).distinct()) == ['alex@example.com']
