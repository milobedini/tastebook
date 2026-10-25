from django.db import models
from django.db.models.functions import Lower


class RecipeQuerySet(models.QuerySet['Recipe']):
    def alphabetical(self) -> RecipeQuerySet:
        # id breaks ties, so the recipe added first comes first when two titles match.
        return self.order_by(Lower('title'), 'id')


class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True)

    objects = RecipeQuerySet.as_manager()

    def __str__(self) -> str:
        return self.title
