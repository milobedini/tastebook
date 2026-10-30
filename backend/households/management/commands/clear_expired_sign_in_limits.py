from typing import Any

from django.core.management.base import BaseCommand

from households.services import clear_expired_sign_in_limits


class Command(BaseCommand):
    help = 'Deletes sign-in limits whose time has passed. Runs every night from .github/workflows/backup.yml.'

    def handle(self, *args: Any, **options: Any) -> None:
        cleared = clear_expired_sign_in_limits()
        self.stdout.write(f'Cleared {cleared} expired sign-in limits.')
