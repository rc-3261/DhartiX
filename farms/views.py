from rest_framework import permissions, viewsets
from rest_framework.response import Response

from accounts.permissions import IsFarmerOrAdmin

from .models import Farm
from .serializers import FarmSerializer


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['name', 'location', 'soil_type']
    ordering_fields = ['name', 'created_at', 'area']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            return Farm.objects.select_related('farmer').all()
        return Farm.objects.filter(farmer=user)

    def perform_create(self, serializer):
        if self.request.user.is_admin_user and self.request.data.get('farmer'):
            serializer.save(farmer_id=self.request.data.get('farmer'))
        else:
            serializer.save(farmer=self.request.user)

    def destroy(self, request, *args, **kwargs):
        farm = self.get_object()
        farm.delete()
        return Response({'detail': 'Farm deleted successfully.'})