from typing import Any

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager['User']):
    use_in_migrations = True

    def create_user(self, email: str, password: str | None = None, **extra_fields: Any) -> User:
        user = self.model(email=self.normalize_email(email), **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields: Any) -> User:
        extra_fields.update(is_staff=True, is_superuser=True)
        return self.create_user(email, password, **extra_fields)


NAME_MAX_LENGTH = 50


class UnitSystem(models.TextChoices):
    METRIC = 'metric', 'Metric'
    US = 'us', 'US customary'


class Household(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    # Blank until the account gives it on the name page; shown on recipes it writes ("by Milo").
    name = models.CharField(max_length=NAME_MAX_LENGTH, blank=True)
    household = models.ForeignKey(Household, null=True, blank=True, on_delete=models.PROTECT, related_name='members')
    # Every recipe page opens in it; the switch on a recipe page doesn't change it.
    unit_system = models.CharField(max_length=6, choices=UnitSystem.choices, default=UnitSystem.METRIC)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        constraints = [
            # Every named account belongs to a household: the name and the household are saved together.
            models.CheckConstraint(
                condition=models.Q(name='') | models.Q(household__isnull=False),
                name='named_account_has_household',
            ),
        ]

    def __str__(self) -> str:
        return self.email


class StoredSignInCode(models.Model):
    email = models.EmailField(unique=True)
    code = models.CharField(max_length=6)
    sent_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.email
