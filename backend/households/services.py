from django.conf import settings
from django.db import transaction

from households.models import Household, StoredSignInCode, User


def is_test_account(email: str) -> bool:
    return email.rpartition('@')[2].lower() == settings.TEST_ACCOUNT_DOMAIN


def store_sign_in_code(email: str, code: str) -> None:
    StoredSignInCode.objects.update_or_create(email=email.lower(), defaults={'code': code})


def latest_sign_in_code(email: str) -> str | None:
    stored = StoredSignInCode.objects.filter(email=email.lower()).first()
    return stored.code if stored else None


def household_name_for(name: str) -> str:
    return f"{name}'s household"


def name_account(user: User, name: str) -> User:
    """Sets the account's name; an account with no household gets a new one, named after it."""
    with transaction.atomic():
        # Locking the row means two saves at once (a double press, two tabs) can't make two households.
        account = User.objects.select_for_update().get(pk=user.pk)
        account.name = name
        if account.household_id is None:
            account.household = Household.objects.create(name=household_name_for(name))
        account.save(update_fields=['name', 'household'])
    return account
