from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import BuyerProfile, FarmerProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'phone', 'avatar', 'full_name', 'is_verified', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        name = ' '.join([obj.first_name, obj.last_name]).strip()
        return name or obj.username


class FarmerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = FarmerProfile
        fields = ['id', 'user', 'farm_name', 'location', 'bio']


class BuyerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = BuyerProfile
        fields = ['id', 'user', 'address', 'city', 'phone']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    farm_name = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password2', 'role',
                  'first_name', 'last_name', 'phone', 'farm_name', 'location', 'address']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        if attrs.get('role') not in ('FARMER', 'BUYER'):
            raise serializers.ValidationError({'role': 'Role must be FARMER or BUYER.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2')
        farm_name = validated_data.pop('farm_name', '')
        location = validated_data.pop('location', '')
        address = validated_data.pop('address', '')
        role = validated_data.get('role', 'BUYER')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        if role == 'FARMER':
            FarmerProfile.objects.create(user=user, farm_name=farm_name, location=location)
        else:
            BuyerProfile.objects.create(user=user, address=address)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])