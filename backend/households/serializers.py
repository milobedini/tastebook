from rest_framework import serializers


class SignInCodeSerializer(serializers.Serializer):
    code = serializers.CharField()


class AccountSerializer(serializers.Serializer):
    email = serializers.EmailField()


class CurrentAccountSerializer(serializers.Serializer):
    account = AccountSerializer(allow_null=True)
