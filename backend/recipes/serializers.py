from rest_framework import serializers

from recipes.models import Course, Cuisine, Equipment, Recipe


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


class RecipeSummarySerializer(serializers.ModelSerializer):
    cuisines = CuisineSerializer(many=True, read_only=True)
    total_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'slug', 'title', 'description', 'cuisines', 'difficulty', 'total_minutes']
        # The API always sends description, as '' when there is none, so the schema marks it required.
        extra_kwargs = {'description': {'required': True, 'allow_blank': True}}


class RecipeSerializer(RecipeSummarySerializer):
    courses = CourseSerializer(many=True, read_only=True)
    equipment = EquipmentSerializer(many=True, read_only=True)

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
