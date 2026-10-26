"""Sends Django's unhandled errors to Sentry on Vercel, where the Sentry integration sets `SENTRY_DSN`."""

import os

import sentry_sdk
from django.core.signals import got_request_exception
from sentry_sdk.integrations.django import DjangoIntegration

FLUSH_TIMEOUT_SECONDS = 2


def flush_events(**kwargs: object) -> None:
    # Vercel can suspend the function once the response is sent, before the SDK's background thread posts the event.
    sentry_sdk.flush(timeout=FLUSH_TIMEOUT_SECONDS)


def init_sentry() -> None:
    dsn = os.environ.get('SENTRY_DSN')
    if not dsn:
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get('VERCEL_ENV'),
        release=os.environ.get('VERCEL_GIT_COMMIT_SHA'),
        integrations=[DjangoIntegration()],
        send_default_pii=False,
        max_request_body_size='never',
        # A frame's variables can hold a recipe's text or a person's details.
        include_local_variables=False,
    )
    # Connected after the Django integration's own receiver, so the event is queued before the flush.
    got_request_exception.connect(flush_events, dispatch_uid='sentry-flush-events')
