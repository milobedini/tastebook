from rest_framework import serializers

from recipes.models import Cuisine, Recipe


class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['slug', 'name']


class RecipeSerializer(serializers.ModelSerializer):
    cuisines = CuisineSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'slug', 'title', 'description', 'cuisines']
        # The API always sends description, as '' when there is none, so the schema marks it required.
        extra_kwargs = {'description': {'required': True, 'allow_blank': True}}
