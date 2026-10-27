from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView

from recipes.models import Cuisine, Recipe, RecipeQuerySet
from recipes.serializers import CuisineSerializer, RecipeSerializer, RecipeSummarySerializer


@extend_schema(
    parameters=[
        OpenApiParameter(
            name='q',
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            description='Only recipes whose title contains this text, ignoring case and accents.',
        ),
        OpenApiParameter(
            name='cuisine',
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            description=(
                'Only recipes with the cuisine that has this slug. A blank or unknown slug means every cuisine.'
            ),
        ),
    ]
)
class RecipeListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSummarySerializer

    def get_queryset(self) -> RecipeQuerySet:
        params = self.request.query_params
        return (
            Recipe.objects.matching_title(params.get('q', ''))
            .with_cuisine(params.get('cuisine', ''))
            .prefetch_related('cuisines')
            .alphabetical()
        )


@extend_schema(responses={200: RecipeSerializer, 404: OpenApiResponse(description='No recipe has this slug.')})
class RecipeDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.prefetch_related('cuisines', 'courses', 'equipment').with_ingredients_and_method()
    lookup_field = 'slug'


class CuisineListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = CuisineSerializer
    queryset = Cuisine.objects.all()
