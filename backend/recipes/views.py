from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView

from recipes.models import Recipe, RecipeQuerySet
from recipes.serializers import RecipeSerializer


@extend_schema(
    parameters=[
        OpenApiParameter(
            name='q',
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            description='Only recipes whose title contains this text, ignoring case and accents.',
        )
    ]
)
class RecipeListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSerializer

    def get_queryset(self) -> RecipeQuerySet:
        return Recipe.objects.matching_title(self.request.query_params.get('q', '')).alphabetical()


@extend_schema(responses={200: RecipeSerializer, 404: OpenApiResponse(description='No recipe has this slug.')})
class RecipeDetailView(RetrieveAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()
    lookup_field = 'slug'
