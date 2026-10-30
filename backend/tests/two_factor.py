import re
import time

from allauth.mfa.totp.internal.auth import format_hotp_value, hotp_value
from django.test import Client

KEY = re.compile(r'\b[A-Z2-7]{32}\b')
RECOVERY_CODE = re.compile(r'<code>(\d{8})</code>')


def current_code(key: str) -> str:
    return format_hotp_value(hotp_value(key, int(time.time()) // 30))


def setup_key(html: str) -> str:
    match = KEY.search(html)
    assert match, 'no key on the setup page'
    return match.group(0)


def set_up_two_factor(client: Client) -> tuple[str, list[str]]:
    """Sets up an authenticator for the client's signed-in staff account; returns its key and recovery codes."""
    key = setup_key(client.get('/admin/two-factor/').content.decode())
    html = client.post('/admin/two-factor/', {'code': current_code(key)}).content.decode()
    return key, RECOVERY_CODE.findall(html)
