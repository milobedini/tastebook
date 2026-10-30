from rest_framework import serializers

from households.models import NAME_MAX_LENGTH


class SignInCodeSerializer(serializers.Serializer):
    code = serializers.CharField()


class AccountSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField()


class AccountNameSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=NAME_MAX_LENGTH)


class CurrentAccountSerializer(serializers.Serializer):
    account = AccountSerializer(allow_null=True)
