from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.permissions import IsFarmerOrAdmin

from .models import Field
from .serializers import FieldSerializer


class FieldViewSet(viewsets.ModelViewSet):
    serializer_class = FieldSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['name', 'location', 'soil_type', 'status']
    ordering_fields = ['name', 'created_at', 'area']

    def get_queryset(self):
        user = self.request.user
        qs = Field.objects.select_related('farm', 'farm__farmer').all()
        if user.is_admin_user:
            return qs
        return qs.filter(farm__farmer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if not request.user.is_admin_user and obj.farm.farmer_id != request.user.id:
            raise PermissionDenied('You do not have access to this field.')

    def perform_create(self, serializer):
        farm_id = self.request.data.get('farm')
        if not farm_id:
            raise PermissionDenied('A farm is required.')
        from farms.models import Farm
        farm = get_object_or_404(Farm, pk=farm_id)
        if not self.request.user.is_admin_user and farm.farmer_id != self.request.user.id:
            raise PermissionDenied('You do not have access to this farm.')
        serializer.save(farm=farm)

    def destroy(self, request, *args, **kwargs):
        field = self.get_object()
        field.delete()
        return Response({'detail': 'Field deleted successfully.'})