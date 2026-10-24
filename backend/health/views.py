from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from health.serializers import HealthSerializer


def database_status() -> str:
    try:
        connection.ensure_connection()
    except DatabaseError:
        return 'unavailable'
    return 'ok'


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(responses=HealthSerializer, operation_id='health_retrieve')
    def get(self, request: Request) -> Response:
        serializer = HealthSerializer({'status': 'ok', 'database': database_status()})
        return Response(serializer.data)
