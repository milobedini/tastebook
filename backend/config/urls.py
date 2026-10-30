from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from households.views import CurrentAccountView
from recipes.views import CourseListView, CuisineListView, IngredientListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', include('health.urls')),
    path('api/account/', CurrentAccountView.as_view(), name='current-account'),
    path('api/test-accounts/', include('households.urls')),
    path('api/_allauth/', include('allauth.headless.urls')),
    path('api/recipes/', include('recipes.urls')),
    path('api/cuisines/', CuisineListView.as_view(), name='cuisine-list'),
    path('api/courses/', CourseListView.as_view(), name='course-list'),
    path('api/ingredients/', IngredientListView.as_view(), name='ingredient-list'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='schema-docs'),
]
