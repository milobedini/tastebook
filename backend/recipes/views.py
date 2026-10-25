from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView

from recipes.models import Recipe
from recipes.serializers import RecipeSerializer


class RecipeListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.alphabetical()


@extend_schema(responses={200: RecipeSerializer, 404: OpenApiResponse(description='No recipe has this slug.')})
class RecipeDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()
    lookup_field = 'slug'
