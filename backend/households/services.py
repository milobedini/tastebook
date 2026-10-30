import math
import time
from typing import Any

from allauth.account.authentication import get_authentication_records
from allauth.core.internal.ratelimit import Rate, get_cache_key, get_rates
from allauth.mfa.base.internal.flows import post_authentication
from allauth.mfa.models import Authenticator
from allauth.mfa.recovery_codes.internal.auth import RecoveryCodes
from allauth.mfa.totp.forms import ActivateTOTPForm
from allauth.mfa.totp.internal.flows import activate_totp
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.db import connection, transaction
from django.http import HttpRequest
from django.utils import timezone

from households.models import NAME_MAX_LENGTH, Household, StoredSignInCode, UnitSystem, User


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


def update_account(user: User, name: str | None = None, unit_system: UnitSystem | None = None) -> User:
    """Saves whichever of the name and unit system are given, together; naming follows name_account."""
    with transaction.atomic():
        account = name_account(user, name) if name is not None else User.objects.select_for_update().get(pk=user.pk)
        if unit_system is not None:
            account.unit_system = unit_system
            account.save(update_fields=['unit_system'])
    return account


def name_from_google(profile: dict[str, Any]) -> str:
    """The first name on a Google profile, as an account's name; blank when it has none that fits."""
    name = str(profile.get('given_name') or '').strip()
    return name if len(name) <= NAME_MAX_LENGTH else ''


ALLAUTH_LIMITS = 'allauth.account'


def seconds_until_allowed(request: HttpRequest, action: str, key: str | None = None) -> int:
    """Whole seconds until every allauth limit on `action` would let `request` through again; at least 1."""
    now = time.time()
    waits = [
        wait_for(
            rate, cache.get(get_cache_key(request, app=ALLAUTH_LIMITS, action=action, rate=rate, key=key), []), now
        )
        for rate in get_rates(app=ALLAUTH_LIMITS, action=action)
    ]
    return max(1, math.ceil(max(waits, default=0)))


def wait_for(rate: Rate, history: list[float], now: float) -> float:
    # allauth keeps the newest hit first; a slot frees when the rate.amount-th newest one leaves the window.
    live = [hit for hit in history if hit > now - rate.duration]
    return live[rate.amount - 1] + rate.duration - now if len(live) >= rate.amount else 0


def clear_expired_sign_in_limits() -> int:
    """Deletes the cache rows whose time has passed, and says how many; the cache holds only sign-in's limits."""
    # Django deletes expired rows only once the table passes MAX_ENTRIES, and these rows hold client IP addresses.
    table = connection.ops.quote_name(settings.CACHES['default']['LOCATION'])
    with connection.cursor() as cursor:
        cursor.execute(f'DELETE FROM {table} WHERE expires < %s', [timezone.now()])
        return cursor.rowcount


def is_staff_account(user: AbstractBaseUser | AnonymousUser) -> bool:
    return bool(user.is_authenticated and user.is_active and user.is_staff)


def has_authenticator(user: AbstractBaseUser) -> bool:
    return Authenticator.objects.filter(user_id=user.pk, type=Authenticator.Type.TOTP).exists()


def passed_two_factors(request: HttpRequest) -> bool:
    """Whether this session's sign-in included an authenticator or recovery code that the account still has."""
    used = [
        record.get('id')
        for record in get_authentication_records(request, request.user)
        if record.get('method') == 'mfa'
    ]
    # Only factors that still exist count: after reset_two_factor, a new authenticator mustn't vouch for this session.
    return Authenticator.objects.filter(user_id=request.user.pk, pk__in=used).exists()


def may_open_admin(request: HttpRequest) -> bool:
    return is_staff_account(request.user) and passed_two_factors(request)


def turn_on_two_factor(request: HttpRequest, form: ActivateTOTPForm) -> list[str]:
    """Saves the authenticator and recovery codes; counts as this session's second factor. Returns the codes."""
    totp, recovery = activate_totp(request, form)
    # The code that confirmed the app proves the second factor, so the admin opens without asking again.
    post_authentication(request, totp)
    # Never None here: setup runs only without an authenticator, and removing one removes its recovery codes.
    return RecoveryCodes(recovery).get_unused_codes()


def account_with_email(email: str) -> User:
    return User.objects.get(email__iexact=email)


def make_staff(email: str) -> User:
    """Makes the account with this address staff and superuser; raises User.DoesNotExist when there's none."""
    account = account_with_email(email)
    account.is_staff = True
    account.is_superuser = True
    account.save(update_fields=['is_staff', 'is_superuser'])
    return account


def reset_two_factor(email: str) -> int:
    """Deletes the account's authenticator and recovery codes and says how many; raises User.DoesNotExist."""
    deleted, _ = Authenticator.objects.filter(user=account_with_email(email)).delete()
    return deleted
