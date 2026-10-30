from typing import Any

from rest_framework import serializers

from households.models import NAME_MAX_LENGTH, UnitSystem


class SignInCodeSerializer(serializers.Serializer):
    code = serializers.CharField()


class AccountSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField()
    unit_system = serializers.ChoiceField(choices=UnitSystem.choices)


class AccountChangesSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=NAME_MAX_LENGTH, required=False)
    unit_system = serializers.ChoiceField(choices=UnitSystem.choices, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError('Send a name or a unit system.')
        return attrs


class CurrentAccountSerializer(serializers.Serializer):
    account = AccountSerializer(allow_null=True)
