from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.permissions import IsFarmerOrAdmin

from .models import Resource
from .serializers import ResourceSerializer


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['name', 'category', 'notes']
    ordering_fields = ['name', 'quantity', 'cost', 'expiry_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Resource.objects.all()
        if user.is_admin_user:
            return qs
        return qs.filter(farmer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if not request.user.is_admin_user and obj.farmer_id != request.user.id:
            raise PermissionDenied('You do not have access to this resource.')

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)

    def destroy(self, request, *args, **kwargs):
        resource = self.get_object()
        resource.delete()
        return Response({'detail': 'Resource deleted successfully.'})