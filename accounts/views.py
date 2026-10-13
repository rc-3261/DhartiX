from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import BuyerProfile, FarmerProfile
from .serializers import (
    BuyerProfileSerializer,
    ChangePasswordSerializer,
    FarmerProfileSerializer,
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        data = UserSerializer(user).data
        data['access'] = str(refresh.access_token)
        data['refresh'] = str(refresh)
        return Response(data, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out successfully.'})


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        if user.role == 'FARMER':
            profile = FarmerProfile.objects.filter(user=user).first()
            data['farmer_profile'] = FarmerProfileSerializer(profile).data if profile else None
        elif user.role == 'BUYER':
            profile = BuyerProfile.objects.filter(user=user).first()
            data['buyer_profile'] = BuyerProfileSerializer(profile).data if profile else None
        return Response(data)

    def patch(self, request):
        user = request.user
        allowed = ['first_name', 'last_name', 'phone', 'avatar']
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data.get(field))
        user.save()

        if user.role == 'FARMER':
            profile, _ = FarmerProfile.objects.get_or_create(user=user)
            for field in ['farm_name', 'location', 'bio']:
                if field in request.data:
                    setattr(profile, field, request.data.get(field))
            profile.save()
        elif user.role == 'BUYER':
            profile, _ = BuyerProfile.objects.get_or_create(user=user)
            for field in ['address', 'city', 'phone']:
                if field in request.data:
                    setattr(profile, field, request.data.get(field))
            profile.save()

        return Response(UserSerializer(user).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Current password is incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully.'})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()
        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}&uid={uid}"
            try:
                send_mail(
                    'Reset your DhartiX password',
                    f'Hello {user.username},\n\nUse this link to reset your password:\n{reset_url}\n\n'
                    f'Token: {token} UID: {uid}\n\nIf you did not request this, you can ignore this email.',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=True,
                )
            except Exception:
                pass
            return Response({
                'detail': 'If an account exists with that email, a reset link has been sent.',
                'reset_token': token,
                'reset_uid': uid,
            })
        return Response({'detail': 'If an account exists with that email, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        uid = request.data.get('uid', '')
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str
        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except Exception:
            return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password has been reset successfully.'})