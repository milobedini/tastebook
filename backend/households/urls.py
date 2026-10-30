from django.urls import path

from households.views import TestAccountCodeView

urlpatterns = [
    path('code/', TestAccountCodeView.as_view(), name='test-account-code'),
]
