from typing import Any

from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.db.models.functions import Lower

from recipes.photos import COMMONS_FILE, COMMONS_FILE_PAGE, Photo
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

    def with_ingredients_and_method(self) -> RecipeQuerySet:
        lines = IngredientLine.objects.select_related('ingredient')
        # Lines in no group land in ungrouped_lines, so a group's lines aren't listed twice.
        return self.prefetch_related(
            models.Prefetch('ingredient_lines', queryset=lines.filter(group=None), to_attr='ungrouped_lines'),
            models.Prefetch('ingredient_groups__lines', queryset=lines),
            'steps',
        )

    def with_diet_tags(self) -> RecipeQuerySet:
        # Every line with its ingredient, grouped or not, as the diet tags are worked out from them all.
        lines = IngredientLine.objects.select_related('ingredient')
        return self.prefetch_related(models.Prefetch('ingredient_lines', queryset=lines))

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
    servings = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1)], help_text='Leave empty when giving a yield.'
    )
    yield_amount = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1)], help_text='"12" in "makes 12 cookies".'
    )
    yield_unit = models.CharField(max_length=50, blank=True, help_text='"cookies" in "makes 12 cookies".')
    equipment = models.ManyToManyField(Equipment, related_name='recipes', blank=True)
    one_pot = models.BooleanField('one-pot', default=False)
    source = models.CharField(
        'source credit', max_length=300, help_text='Where the recipe came from: an author, a website or a book.'
    )
    photo_url = models.URLField(
        'photo address',
        max_length=500,
        blank=True,
        validators=[
            RegexValidator(
                COMMONS_FILE,
                'Give the address of a JPEG, PNG or WebP file on Wikimedia Commons, '
                'starting https://upload.wikimedia.org/wikipedia/commons/.',
                # A code of its own, as the admin form swaps the default 'invalid' for "Enter a valid URL."
                code='not_commons_file',
            )
        ],
        help_text=(
            'On the photo\'s Wikimedia Commons page, copy the address of "Original file". '
            'Leave the photo empty to show the cuisine plate.'
        ),
    )
    photo_author = models.CharField('photo author', max_length=200, blank=True)
    photo_licence = models.CharField(
        'photo licence', max_length=50, blank=True, help_text='As Commons gives it, such as CC BY-SA 4.0.'
    )
    photo_source_url = models.URLField(
        'photo source',
        max_length=500,
        blank=True,
        validators=[
            RegexValidator(
                COMMONS_FILE_PAGE,
                "Give the photo's page on Wikimedia Commons, starting https://commons.wikimedia.org/wiki/File:.",
                code='not_commons_file_page',
            )
        ],
        help_text="The photo's page on Wikimedia Commons, starting https://commons.wikimedia.org/wiki/File:.",
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
            models.CheckConstraint(
                condition=(
                    models.Q(photo_url='', photo_author='', photo_licence='', photo_source_url='')
                    | ~models.Q(photo_url='')
                    & ~models.Q(photo_author='')
                    & ~models.Q(photo_licence='')
                    & ~models.Q(photo_source_url='')
                ),
                name='recipe_photo_is_credited',
                violation_error_message='Give a photo with its author, licence and source, or none of them.',
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

    @property
    def photo(self) -> Photo | None:
        if self.photo_url == '':
            return None
        return Photo(self.photo_url, self.photo_author, self.photo_licence, self.photo_source_url)


class Ingredient(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text='The UK name: courgette, coriander, plain flour.')
    slug = models.SlugField(max_length=100, unique=True)
    # What it contains, from which a recipe's diet tags are worked out.
    contains_meat = models.BooleanField('meat', default=False, help_text='Including gelatine, lard and meat stock.')
    contains_fish = models.BooleanField(
        'fish', default=False, help_text='Including shellfish, anchovies and fish sauce.'
    )
    contains_dairy = models.BooleanField('dairy', default=False, help_text='Milk, cream, butter, cheese, yoghurt.')
    contains_egg = models.BooleanField('egg', default=False)
    contains_other_animal_product = models.BooleanField(
        'other animal product', default=False, help_text='Such as honey: vegetarian, but not vegan.'
    )
    contains_gluten = models.BooleanField(
        'gluten', default=False, help_text='Wheat, barley and rye, and oats not labelled gluten-free.'
    )
    CONTAINS = (
        'contains_meat',
        'contains_fish',
        'contains_dairy',
        'contains_egg',
        'contains_other_animal_product',
        'contains_gluten',
    )

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class DietTag(models.TextChoices):
    VEGETARIAN = 'vegetarian', 'Vegetarian'
    VEGAN = 'vegan', 'Vegan'
    GLUTEN_FREE = 'gluten_free', 'Gluten-free'
    DAIRY_FREE = 'dairy_free', 'Dairy-free'


class Unit(models.TextChoices):
    GRAM = 'g', 'g'
    KILOGRAM = 'kg', 'kg'
    MILLILITRE = 'ml', 'ml'
    LITRE = 'l', 'l'
    TEASPOON = 'tsp', 'tsp'
    TABLESPOON = 'tbsp', 'tbsp'
    CUP = 'cup', 'cup'
    OUNCE = 'oz', 'oz'
    POUND = 'lb', 'lb'
    FLUID_OUNCE = 'fl_oz', 'fl oz'
    PINCH = 'pinch', 'pinch'
    CLOVE = 'clove', 'clove'
    TIN = 'tin', 'tin'
    SLICE = 'slice', 'slice'
    BUNCH = 'bunch', 'bunch'
    HANDFUL = 'handful', 'handful'


class IngredientGroup(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredient_groups')
    name = models.CharField(max_length=100, help_text='"For the sauce", "To serve".')
    position = models.PositiveSmallIntegerField(default=0, help_text='Lower numbers come first.')

    class Meta:
        ordering = ['position', 'id']

    def __str__(self) -> str:
        return self.name


class IngredientLine(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredient_lines')
    group = models.ForeignKey(
        IngredientGroup,
        # Deleting a group moves its lines above the groups rather than losing them.
        on_delete=models.SET_NULL,
        related_name='lines',
        null=True,
        blank=True,
        help_text='Leave empty for a line above every group. Save a new group before choosing it.',
    )
    position = models.PositiveSmallIntegerField(default=0, help_text='Lower numbers come first.')
    amount = models.DecimalField(
        max_digits=8, decimal_places=3, null=True, blank=True, help_text='Leave empty for "to taste".'
    )
    amount_max = models.DecimalField(
        'up to', max_digits=8, decimal_places=3, null=True, blank=True, help_text='"3" in a range of 2 to 3.'
    )
    unit = models.CharField(max_length=10, choices=Unit.choices, blank=True, help_text='Leave empty for "2 eggs".')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name='lines')
    note = models.CharField(max_length=200, blank=True, help_text='"finely chopped".')
    optional = models.BooleanField(default=False)
    original_text = models.CharField(
        'original wording', max_length=300, blank=True, help_text='The line as the recipe was written.'
    )

    class Meta:
        ordering = ['position', 'id']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__isnull=True) | models.Q(amount__gt=0),
                name='ingredientline_amount_positive',
                violation_error_message='Give an amount above 0, or leave it empty.',
            ),
            models.CheckConstraint(
                condition=models.Q(amount_max__isnull=True)
                | models.Q(amount__isnull=False, amount_max__gt=models.F('amount')),
                name='ingredientline_range_rises',
                violation_error_message='Give a range with its lower amount first, such as 2 up to 3.',
            ),
        ]

    def __str__(self) -> str:
        return self.original_text or self.ingredient.name


class Step(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='steps')
    position = models.PositiveSmallIntegerField(default=0, help_text='Lower numbers come first.')
    text = models.TextField()

    class Meta:
        ordering = ['position', 'id']

    def __str__(self) -> str:
        return self.text[:50]
