from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdminUser
from .serializers import UserSerializer

User = get_user_model()


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only user management (list, view, edit, delete)."""
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'role', 'phone']
    ordering_fields = ['date_joined', 'username', 'role']
    http_method_names = ['get', 'head', 'options', 'patch', 'delete', 'put']

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role.upper())
        return qs.order_by('-date_joined')

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        role = request.data.get('role')
        if role and role in ('FARMER', 'BUYER', 'ADMIN'):
            user.role = role
        for field in ('first_name', 'last_name', 'phone', 'email'):
            if field in request.data:
                setattr(user, field, request.data.get(field))
        password = request.data.get('password')
        if password:
            user.set_password(password)
        user.save()
        return Response(UserSerializer(user).data)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().id == request.user.id:
            return Response({'detail': 'You cannot delete your own account.'}, status=400)
        return super().destroy(request, *args, **kwargs)


class SystemConfigView(APIView):
    """Expose non-secret system configuration status to admins."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.conf import settings
        return Response({
            'database': 'mysql' if settings.DB_ENGINE == 'mysql' else 'sqlite',
            'ai_configured': bool(settings.AI_API_KEY),
            'ai_model': settings.AI_MODEL,
            'weather_configured': bool(settings.WEATHER_API_KEY),
            'iot_token_configured': bool(settings.IOT_DEVICE_TOKEN),
            'cors_origins': settings.CORS_ALLOWED_ORIGINS,
            'debug': settings.DEBUG,
        })