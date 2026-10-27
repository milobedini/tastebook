from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView

from recipes.models import Course, Cuisine, Recipe, RecipeQuerySet
from recipes.serializers import (
    CourseSerializer,
    CuisineSerializer,
    RecipeFiltersSerializer,
    RecipeSerializer,
    RecipeSummarySerializer,
)


@extend_schema(
    parameters=[RecipeFiltersSerializer],
    responses={
        200: RecipeSummarySerializer(many=True),
        400: OpenApiResponse(description='A difficulty, a diet or a time limit is not one the list accepts.'),
    },
)
class RecipeListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = RecipeSummarySerializer

    def get_queryset(self) -> RecipeQuerySet:
        filters = RecipeFiltersSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        given = filters.validated_data
        return (
            Recipe.objects.search(given['q'])
            .with_cuisines(given['cuisine'])
            .with_courses(given['course'])
            .with_difficulties(given['difficulty'])
            .taking_at_most(prep=given.get('max_prep'), cook=given.get('max_cook'), total=given.get('max_total'))
            .only_one_pot(given['one_pot'])
            .suiting(given['diet'])
            .using_any_of(given['include_ingredient'])
            .using_none_of(given['exclude_ingredient'])
            .prefetch_related('cuisines')
            .with_diet_tags()
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


class CourseListView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = CourseSerializer
    queryset = Course.objects.all()
