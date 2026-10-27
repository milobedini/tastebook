from django.contrib import admin

from recipes.models import Cuisine, Equipment, Recipe


@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


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
    )
