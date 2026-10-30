import hmac

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotAuthenticated, NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from households.serializers import (
    AccountNameSerializer,
    AccountSerializer,
    CurrentAccountSerializer,
    SignInCodeSerializer,
)
from households.services import is_test_account, latest_sign_in_code, name_account


def may_read_codes(request: Request) -> bool:
    if not settings.TEST_ACCOUNTS_ENABLED:
        return False
    if not settings.TEST_ACCOUNT_CODES_NEED_SECRET:
        return True
    secret = request.headers.get('X-Test-Account-Secret', '')
    return bool(settings.TEST_ACCOUNT_SECRET) and hmac.compare_digest(secret, settings.TEST_ACCOUNT_SECRET)


class TestAccountCodeView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        operation_id='test_account_code_retrieve',
        parameters=[OpenApiParameter('email', str, required=True)],
        responses={200: SignInCodeSerializer, 404: None},
        description='The latest sign-in code of a test account at tastebook.test. Local runs and previews only; '
        '404 on production.',
    )
    def get(self, request: Request) -> Response:
        email = request.query_params.get('email', '')
        if not may_read_codes(request) or not is_test_account(email):
            raise NotFound
        code = latest_sign_in_code(email)
        if code is None:
            raise NotFound
        return Response(SignInCodeSerializer({'code': code}).data)


# allauth's own session endpoint answers 401 to a visitor who isn't signed in, which browsers log as an error on every
# page; this one answers 200 either way. It also sets the CSRF cookie that allauth's unsafe requests send back.
@method_decorator(ensure_csrf_cookie, name='get')
class CurrentAccountView(APIView):
    @extend_schema(
        operation_id='current_account_retrieve',
        responses={200: CurrentAccountSerializer},
        description='The account signed in on this browser, or null when nobody is.',
    )
    def get(self, request: Request) -> Response:
        account = request.user if request.user.is_authenticated else None
        return Response(CurrentAccountSerializer({'account': account}).data)

    @extend_schema(
        operation_id='current_account_partial_update',
        request=AccountNameSerializer,
        responses={200: AccountSerializer, 400: None, 403: None},
        description="Saves the signed-in account's name. An account with no household gets one called "
        '"<name>\'s household".',
    )
    def patch(self, request: Request) -> Response:
        if not request.user.is_authenticated:
            raise NotAuthenticated
        names = AccountNameSerializer(data=request.data)
        names.is_valid(raise_exception=True)
        account = name_account(request.user, names.validated_data['name'])
        return Response(AccountSerializer(account).data)
