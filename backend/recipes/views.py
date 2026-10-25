from rest_framework.generics import ListAPIView

from recipes.models import Recipe
from recipes.serializers import RecipeSerializer


class RecipeListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.alphabetical()
