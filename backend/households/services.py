import math
import time
from typing import Any

from allauth.core.internal.ratelimit import Rate, get_cache_key, get_rates
from django.conf import settings
from django.core.cache import cache
from django.db import connection, transaction
from django.http import HttpRequest
from django.utils import timezone

from households.models import NAME_MAX_LENGTH, Household, StoredSignInCode, User


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
