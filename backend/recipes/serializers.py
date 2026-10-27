from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from recipes import services
from recipes.models import (
    Course,
    Cuisine,
    DietTag,
    Equipment,
    Ingredient,
    IngredientGroup,
    IngredientLine,
    Recipe,
    Step,
)


class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['slug', 'name']


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['slug', 'name']


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ['slug', 'name']


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['slug', 'name']


class IngredientLineSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)
    # Numbers, not strings, so the page can format and later scale them.
    amount = serializers.DecimalField(max_digits=8, decimal_places=3, coerce_to_string=False, allow_null=True)
    amount_max = serializers.DecimalField(max_digits=8, decimal_places=3, coerce_to_string=False, allow_null=True)

    class Meta:
        model = IngredientLine
        fields = ['id', 'amount', 'amount_max', 'unit', 'ingredient', 'note', 'optional']
        extra_kwargs = {
            'unit': {'required': True, 'allow_blank': True},
            'note': {'required': True, 'allow_blank': True},
            'optional': {'required': True},
        }


class IngredientGroupSerializer(serializers.ModelSerializer):
    lines = IngredientLineSerializer(many=True, read_only=True)

    class Meta:
        model = IngredientGroup
        fields = ['id', 'name', 'lines']


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ['id', 'text']


class PhotoThumbnailSerializer(serializers.Serializer):
    width = serializers.IntegerField(read_only=True)
    url = serializers.URLField(read_only=True)


class RecipePhotoSerializer(serializers.Serializer):
    thumbnails = PhotoThumbnailSerializer(many=True, read_only=True)
    author = serializers.CharField(read_only=True)
    licence = serializers.CharField(read_only=True)
    source_url = serializers.URLField(read_only=True)


class DietTagsField(serializers.ListField):
    child = serializers.ChoiceField(choices=DietTag.choices)


class DietTagConflictSerializer(serializers.Serializer):
    ingredient = IngredientSerializer(read_only=True)
    diet_tags = DietTagsField(read_only=True)


class RecipeSummarySerializer(serializers.ModelSerializer):
    cuisines = CuisineSerializer(many=True, read_only=True)
    total_minutes = serializers.IntegerField(read_only=True)
    # null when the recipe has no photo, so the card shows its cuisine plate.
    photo = RecipePhotoSerializer(read_only=True, allow_null=True)
    diet_tags = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'slug', 'title', 'description', 'cuisines', 'difficulty', 'total_minutes', 'photo', 'diet_tags']
        # The API always sends description, as '' when there is none, so the schema marks it required.
        extra_kwargs = {'description': {'required': True, 'allow_blank': True}}

    @extend_schema_field(DietTagsField(read_only=True))
    def get_diet_tags(self, recipe: Recipe) -> list[DietTag]:
        return services.diet_tags(recipe.ingredient_lines.all())


class RecipeSerializer(RecipeSummarySerializer):
    courses = CourseSerializer(many=True, read_only=True)
    equipment = EquipmentSerializer(many=True, read_only=True)
    # Lines in no group, shown before the groups; ungrouped_lines exists only on with_ingredients_and_method().
    ingredient_lines = IngredientLineSerializer(many=True, read_only=True, source='ungrouped_lines')
    ingredient_groups = IngredientGroupSerializer(many=True, read_only=True)
    steps = StepSerializer(many=True, read_only=True)
    # The optional ingredients that would take a diet tag away: "leave out the parmesan to keep it vegan".
    diet_tag_conflicts = serializers.SerializerMethodField()

    class Meta(RecipeSummarySerializer.Meta):
        fields = [
            *RecipeSummarySerializer.Meta.fields,
            'courses',
            'prep_minutes',
            'cook_minutes',
            'extra_minutes',
            'extra_label',
            'servings',
            'yield_amount',
            'yield_unit',
            'equipment',
            'one_pot',
            'source',
            'ingredient_lines',
            'ingredient_groups',
            'steps',
            'diet_tag_conflicts',
        ]
        # The API always sends these, even when they're '', null or their default, so the schema marks them required.
        extra_kwargs = {
            **RecipeSummarySerializer.Meta.extra_kwargs,
            'extra_minutes': {'required': True},
            'extra_label': {'required': True, 'allow_blank': True},
            'yield_unit': {'required': True, 'allow_blank': True},
            'servings': {'required': True, 'allow_null': True},
            'yield_amount': {'required': True, 'allow_null': True},
            'one_pot': {'required': True},
        }

    @extend_schema_field(DietTagConflictSerializer(many=True))
    def get_diet_tag_conflicts(self, recipe: Recipe) -> list[dict[str, object]]:
        return DietTagConflictSerializer(services.diet_tag_conflicts(recipe.ingredient_lines.all()), many=True).data
