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

    objects = RecipeQuerySet.as_manager()

    def __str__(self) -> str:
        return self.title

    def save(self, **kwargs: Any) -> None:
        # Set once, so a recipe keeps its address when its title changes.
        if not self.slug:
            self.slug = Recipe.objects.unique_slug_for(self.title)
        super().save(**kwargs)
