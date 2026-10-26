import gzip
import json
import os
import subprocess
import sys
import time
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

import pytest

BACKEND = Path(__file__).resolve().parent.parent

# Nothing listens on port 1, so the recipe list fails with an unhandled database error.
UNREACHABLE_DATABASE = 'postgres://tastebook:tastebook@127.0.0.1:1/tastebook'

REQUEST_A_FAILING_PAGE = """
import json
import sys

import django
import sentry_sdk
from django.test import Client
from django.test.utils import setup_test_environment

django.setup()
setup_test_environment()
response = Client(raise_request_exception=False).generic(
    'GET',
    '/api/recipes/',
    data=json.dumps({'title': 'Grandma secret tart'}),
    content_type='application/json',
    headers={'cookie': 'sessionid=private-session'},
)
print(json.dumps({'status': response.status_code, 'sentry': sentry_sdk.get_client().is_active()}), flush=True)
sys.stdin.read()
"""


class SentryIngest(BaseHTTPRequestHandler):
    envelopes: list[str] = []

    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers['Content-Length']))
        if self.headers.get('Content-Encoding') == 'gzip':
            body = gzip.decompress(body)
        # Slow enough that an event sent in the background lands after the response, not before.
        time.sleep(0.5)
        self.envelopes.append(body.decode())
        self.send_response(200)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        pass


@pytest.fixture
def sentry_ingest() -> Iterator[ThreadingHTTPServer]:
    SentryIngest.envelopes = []
    server = ThreadingHTTPServer(('127.0.0.1', 0), SentryIngest)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield server
    server.shutdown()
    thread.join()


def request_a_failing_page(env: dict[str, str]) -> tuple[dict[str, object], list[str]]:
    """The response, and the envelopes Sentry had received when it was sent."""
    # Settings are read once per process, so each environment gets its own.
    process = subprocess.Popen(
        [sys.executable, '-c', REQUEST_A_FAILING_PAGE],
        cwd=BACKEND,
        env={
            'PATH': os.environ['PATH'],
            'DJANGO_SETTINGS_MODULE': 'config.settings',
            'DJANGO_SECRET_KEY': 'test-only',
            'DATABASE_URL': UNREACHABLE_DATABASE,
            **env,
        },
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        line = process.stdout.readline() if process.stdout else ''
        envelopes = list(SentryIngest.envelopes)
    finally:
        # Vercel can suspend a function as soon as it responds, so anything still queued is lost.
        process.kill()
        _, stderr = process.communicate()
    assert line, stderr
    return json.loads(line), envelopes


def events(envelopes: list[str]) -> list[dict[str, object]]:
    # An envelope is a header line, then an item header line and its payload line for each item.
    return [
        json.loads(payload)
        for envelope in envelopes
        for item_header, payload in zip(envelope.splitlines()[1::2], envelope.splitlines()[2::2], strict=False)
        if json.loads(item_header)['type'] == 'event'
    ]


def test_an_unhandled_error_reaches_sentry_with_its_environment_and_release(
    sentry_ingest: ThreadingHTTPServer,
) -> None:
    port = sentry_ingest.server_address[1]

    result, envelopes = request_a_failing_page(
        {
            'SENTRY_DSN': f'http://public-key@127.0.0.1:{port}/1',
            'VERCEL_ENV': 'preview',
            'VERCEL_GIT_COMMIT_SHA': '4ca3bae7c06fdf9c4d95dd193eb4d6f0e2b651ab',
        }
    )

    assert result == {'status': 500, 'sentry': True}
    [event] = events(envelopes)
    assert event['environment'] == 'preview'
    assert event['release'] == '4ca3bae7c06fdf9c4d95dd193eb4d6f0e2b651ab'
    assert event['exception']['values'][-1]['type'] == 'OperationalError'
    assert event['transaction'] == '/api/recipes/'


def test_an_error_report_carries_no_request_body_cookies_or_local_variables(
    sentry_ingest: ThreadingHTTPServer,
) -> None:
    port = sentry_ingest.server_address[1]

    _, [envelope] = request_a_failing_page({'SENTRY_DSN': f'http://public-key@127.0.0.1:{port}/1'})

    [event] = events([envelope])
    frames = [frame for value in event['exception']['values'] for frame in value['stacktrace']['frames']]
    assert 'ensure_connection' in [frame['function'] for frame in frames]
    assert [frame['function'] for frame in frames if 'vars' in frame] == []
    assert 'Grandma secret tart' not in envelope
    assert 'private-session' not in envelope


@pytest.mark.parametrize(('dsn_is_set', 'events_sent'), [(True, 1), (False, 0)])
def test_sentry_is_on_only_where_a_dsn_is_set(
    sentry_ingest: ThreadingHTTPServer, dsn_is_set: bool, events_sent: int
) -> None:
    port = sentry_ingest.server_address[1]
    env = {'SENTRY_DSN': f'http://public-key@127.0.0.1:{port}/1'} if dsn_is_set else {}

    result, envelopes = request_a_failing_page(env)

    assert result == {'status': 500, 'sentry': dsn_is_set}
    assert len(events(envelopes)) == events_sent
