from typing import Any

from django.db import models
from django.db.models.functions import Lower

from recipes.slugs import base_slug, first_free_slug


class Cuisine(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        # Every list of cuisines (the endpoint, a recipe's own) reads alphabetically.
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Course(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Equipment(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'equipment'

    def __str__(self) -> str:
        return self.name


class Difficulty(models.TextChoices):
    EASY = 'easy', 'Easy'
    MEDIUM = 'medium', 'Medium'
    HARD = 'hard', 'Hard'


class RecipeQuerySet(models.QuerySet['Recipe']):
    def alphabetical(self) -> RecipeQuerySet:
        # id breaks ties, so the recipe added first comes first when two titles match.
        return self.order_by(Lower('title'), 'id')

    def matching_title(self, text: str) -> RecipeQuerySet:
        term = text.strip()
        if term == '':
            return self
        # unaccent is bilateral, so the term loses its accents too: 'crème' and 'creme' both find 'Crème brûlée'.
        return self.filter(title__unaccent__icontains=term)

    def with_cuisine(self, slug: str) -> RecipeQuerySet:
        # An unknown slug (a removed cuisine, a mistyped link) filters nothing, like a blank one.
        if slug == '' or not Cuisine.objects.filter(slug=slug).exists():
            return self
        return self.filter(cuisines__slug=slug)

    def unique_slug_for(self, title: str) -> str:
        base = base_slug(title)
        taken = set(self.filter(slug__startswith=base).values_list('slug', flat=True))
        return first_free_slug(base, taken)


class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True)
    slug = models.SlugField(max_length=255, unique=True, editable=False)
    cuisines = models.ManyToManyField(Cuisine, related_name='recipes')
    courses = models.ManyToManyField(Course, related_name='recipes')
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices)
    prep_minutes = models.PositiveIntegerField()
    cook_minutes = models.PositiveIntegerField()
    extra_minutes = models.PositiveIntegerField(default=0, help_text='Waiting time, such as marinating or proving.')
    extra_label = models.CharField(
        max_length=50, blank=True, help_text='What the extra time is for, such as marinating, resting or proving.'
    )
    servings = models.PositiveSmallIntegerField(null=True, blank=True, help_text='Leave empty when giving a yield.')
    yield_amount = models.PositiveSmallIntegerField(null=True, blank=True, help_text='"12" in "makes 12 cookies".')
    yield_unit = models.CharField(max_length=50, blank=True, help_text='"cookies" in "makes 12 cookies".')
    equipment = models.ManyToManyField(Equipment, related_name='recipes', blank=True)
    one_pot = models.BooleanField('one-pot', default=False)
    source = models.CharField(
        'source credit', max_length=300, help_text='Where the recipe came from: an author, a website or a book.'
    )

    objects = RecipeQuerySet.as_manager()

    class Meta:
        # The admin's full_clean checks these too, so a staff user sees the message instead of an error page.
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(servings__isnull=False, yield_amount__isnull=True, yield_unit='')
                    | models.Q(servings__isnull=True, yield_amount__isnull=False) & ~models.Q(yield_unit='')
                ),
                name='recipe_servings_or_yield',
                violation_error_message='Give either servings or a yield with its unit, not both.',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(extra_minutes=0, extra_label='')
                    | models.Q(extra_minutes__gt=0) & ~models.Q(extra_label='')
                ),
                name='recipe_extra_time_has_label',
                violation_error_message='Give extra time with its label (marinating, resting, proving), or neither.',
            ),
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, **kwargs: Any) -> None:
        # Set once, so a recipe keeps its address when its title changes.
        if not self.slug:
            self.slug = Recipe.objects.unique_slug_for(self.title)
        super().save(**kwargs)

    @property
    def total_minutes(self) -> int:
        return self.prep_minutes + self.cook_minutes + self.extra_minutes
