from rest_framework import serializers


class SignInCodeSerializer(serializers.Serializer):
    code = serializers.CharField()
