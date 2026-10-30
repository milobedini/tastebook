from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser

from households.models import User
from households.services import make_staff


class Command(BaseCommand):
    help = 'Makes an existing account staff, so it can open the admin once it has set up two-factor sign-in.'

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument('email')

    def handle(self, *args: Any, email: str, **options: Any) -> None:
        try:
            make_staff(email)
        except User.DoesNotExist as error:
            raise CommandError(f'No account uses {email}. Sign up in the app with it first.') from error
        self.stdout.write(f'{email} is now staff. Open /admin/ to set up two-factor sign-in.')
