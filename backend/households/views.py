import hmac

from django.conf import settings
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from households.serializers import SignInCodeSerializer
from households.services import is_test_account, latest_sign_in_code


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
