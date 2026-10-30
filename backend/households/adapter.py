from typing import Any

from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.core.exceptions import ValidationError

from households.services import is_test_account, store_sign_in_code

TEST_ADDRESS_REFUSED = 'Addresses at tastebook.test are only for testing. Use your own email address.'


class AccountAdapter(DefaultAccountAdapter):
    def clean_email(self, email: str) -> str:
        email = super().clean_email(email)
        if is_test_account(email) and not settings.TEST_ACCOUNTS_ENABLED:
            raise ValidationError(TEST_ADDRESS_REFUSED, code='test_account')
        return email

    def send_mail(self, template_prefix: str, email: str, context: dict[str, Any]) -> None:
        # A test account's code is stored for the end-to-end tests to read, never emailed.
        if settings.TEST_ACCOUNTS_ENABLED and is_test_account(email) and 'code' in context:
            store_sign_in_code(email, context['code'])
            return
        super().send_mail(template_prefix, email, context)
