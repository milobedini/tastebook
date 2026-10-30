from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser

from households.models import User
from households.services import reset_two_factor


class Command(BaseCommand):
    help = "Removes an account's authenticator and recovery codes, for a staff member who has lost their phone."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument('email')

    def handle(self, *args: Any, email: str, **options: Any) -> None:
        try:
            deleted = reset_two_factor(email)
        except User.DoesNotExist as error:
            raise CommandError(f'No account uses {email}. Sign up in the app with it first.') from error
        if deleted:
            self.stdout.write(
                f"Removed {email}'s authenticator and recovery codes. "
                'They set up a new one the next time they open /admin/.'
            )
        else:
            self.stdout.write(f'{email} has no authenticator.')
