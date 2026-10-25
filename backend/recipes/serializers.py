from rest_framework import serializers

from recipes.models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ['id', 'title', 'description']
        # The API always sends description, as '' when there is none, so the schema marks it required.
        extra_kwargs = {'description': {'required': True, 'allow_blank': True}}
