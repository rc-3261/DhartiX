from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.permissions import IsFarmerOrAdmin

from .models import Crop, CropCycle
from .serializers import CropCycleSerializer, CropSerializer


class CropViewSet(viewsets.ModelViewSet):
    serializer_class = CropSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['name', 'variety', 'status', 'current_growth_stage']
    ordering_fields = ['name', 'planting_date', 'expected_harvest_date', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = Crop.objects.select_related('field', 'field__farm', 'field__farm__farmer').all()
        if user.is_admin_user:
            return qs
        return qs.filter(field__farm__farmer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if not request.user.is_admin_user and obj.field.farm.farmer_id != request.user.id:
            raise PermissionDenied('You do not have access to this crop.')

    def perform_create(self, serializer):
        from fields.models import Field
        field_id = self.request.data.get('field')
        if not field_id:
            raise PermissionDenied('A field is required.')
        field = get_object_or_404(Field, pk=field_id)
        if not self.request.user.is_admin_user and field.farm.farmer_id != self.request.user.id:
            raise PermissionDenied('You do not have access to this field.')
        serializer.save(field=field)

    def destroy(self, request, *args, **kwargs):
        crop = self.get_object()
        crop.delete()
        return Response({'detail': 'Crop deleted successfully.'})


class CropCycleViewSet(viewsets.ModelViewSet):
    serializer_class = CropCycleSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = CropCycle.objects.select_related('crop__field__farm').all()
        if user.is_admin_user:
            return qs
        return qs.filter(crop__field__farm__farmer=user)

    def perform_create(self, serializer):
        crop_id = self.request.data.get('crop')
        if not crop_id:
            raise PermissionDenied('A crop is required.')
        crop = get_object_or_404(Crop, pk=crop_id)
        if not self.request.user.is_admin_user and crop.field.farm.farmer_id != self.request.user.id:
            raise PermissionDenied('You do not have access to this crop.')
        serializer.save(crop=crop)