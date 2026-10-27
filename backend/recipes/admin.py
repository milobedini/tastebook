from django.contrib import admin
from django.forms import BaseInlineFormSet, ModelForm

from recipes.models import Cuisine, Equipment, Ingredient, IngredientGroup, IngredientLine, Recipe, Step


@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


class IngredientGroupInline(admin.TabularInline):
    model = IngredientGroup
    fields = ('position', 'name')
    extra = 0


class IngredientLineFormSet(BaseInlineFormSet):
    def add_fields(self, form: ModelForm, index: int | None) -> None:
        super().add_fields(form, index)
        # Django can't nest a group's lines inside it, so each line picks from its own recipe's groups only.
        groups = IngredientGroup.objects.none()
        if self.instance.pk is not None:
            groups = IngredientGroup.objects.filter(recipe=self.instance)
        form.fields['group'].queryset = groups


class IngredientLineInline(admin.TabularInline):
    model = IngredientLine
    formset = IngredientLineFormSet
    fields = ('position', 'group', 'amount', 'amount_max', 'unit', 'ingredient', 'note', 'optional', 'original_text')
    autocomplete_fields = ('ingredient',)
    extra = 0


class StepInline(admin.TabularInline):
    model = Step
    fields = ('position', 'text')
    extra = 0


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'description')
    readonly_fields = ('slug',)
    filter_horizontal = ('cuisines', 'courses', 'equipment')
    fieldsets = (
        (None, {'fields': ('title', 'slug', 'description', 'cuisines', 'courses', 'difficulty', 'one_pot')}),
        ('Time', {'fields': ('prep_minutes', 'cook_minutes', 'extra_minutes', 'extra_label')}),
        ('Servings or yield', {'fields': ('servings', 'yield_amount', 'yield_unit')}),
        (None, {'fields': ('equipment', 'source')}),
        ('Photo', {'fields': ('photo_url', 'photo_author', 'photo_licence', 'photo_source_url')}),
    )
    inlines = (IngredientGroupInline, IngredientLineInline, StepInline)
