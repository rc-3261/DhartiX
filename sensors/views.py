from collections import OrderedDict
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsFarmerOrAdmin
from fields.models import Field

from .models import SensorDevice, SensorReading
from .serializers import (
    SensorDeviceSerializer,
    SensorHistorySerializer,
    SensorReadingCreateSerializer,
    SensorReadingSerializer,
)


class SensorReadingCreateView(APIView):
    """Public IoT endpoint. Devices authenticate using the shared device token."""
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.headers.get('X-Device-Token') or request.data.get('device_token')
        if token != settings.IOT_DEVICE_TOKEN:
            return Response({'error': 'Invalid device token.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = SensorReadingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        device = None
        if data.get('device_id'):
            device = SensorDevice.objects.filter(device_id=data['device_id']).first()

        if not device and data.get('field_id'):
            field = Field.objects.filter(pk=data['field_id']).first()
            if field:
                reading_type = data.get('reading_type')
                name = data.get('device_name') or f'{reading_type} device'
                device = SensorDevice.objects.create(
                    field=field,
                    name=name,
                    device_type=reading_type,
                    device_id=data.get('device_id') or f'auto-{field.id}-{reading_type.lower()}',
                    status='ONLINE',
                )

        if not device:
            return Response({'error': 'Device not found. Provide device_id or field_id.'},
                            status=status.HTTP_404_NOT_FOUND)

        reading = SensorReading.objects.create(
            device=device,
            reading_type=data['reading_type'],
            value=data['value'],
            unit=data.get('unit') or 'unit',
        )
        device.last_reading_at = reading.timestamp
        device.status = 'ONLINE'
        if device.device_type == 'SOIL_MOISTURE' and data['value'] < 25:
            device.status = 'WARNING'
        device.save()
        return Response(SensorReadingSerializer(reading).data, status=status.HTTP_201_CREATED)


class SensorDeviceViewSet(viewsets.ModelViewSet):
    serializer_class = SensorDeviceSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['name', 'device_type', 'status', 'device_id']
    ordering_fields = ['name', 'created_at', 'last_reading_at']

    def get_queryset(self):
        user = self.request.user
        qs = SensorDevice.objects.select_related('field', 'field__farm', 'field__farm__farmer')
        if user.is_admin_user:
            return qs.all()
        return qs.filter(field__farm__farmer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if not request.user.is_admin_user and obj.field.farm.farmer_id != request.user.id:
            raise PermissionDenied('You do not have access to this sensor.')

    def perform_create(self, serializer):
        from fields.models import Field
        field_id = self.request.data.get('field')
        if not field_id:
            raise PermissionDenied('A field is required.')
        field = Field.objects.filter(pk=field_id).first()
        if not field or (not self.request.user.is_admin_user and field.farm.farmer_id != self.request.user.id):
            raise PermissionDenied('You do not have access to this field.')
        data = dict(self.request.data)
        device_id = data.get('device_id') or f'sens-{field_id}-{len(SensorDevice.objects.filter(field=field)) + 1}'
        serializer.save(field=field, device_id=device_id)

    @action(detail=True, methods=['get'])
    def readings(self, request, pk=None):
        device = self.get_object()
        qs = device.readings.all()
        limit = int(request.query_params.get('limit', 20))
        qs = qs[:limit]
        return Response(SensorReadingSerializer(qs, many=True).data)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        device = self.get_object()
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        qs = device.readings.filter(timestamp__gte=since).order_by('timestamp')
        return Response(SensorReadingSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def mark_offline(self, request, pk=None):
        device = self.get_object()
        device.status = 'OFFLINE'
        device.save()
        return Response(SensorDeviceSerializer(device).data)


class SensorReadingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SensorReadingSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['reading_type', 'device__name']

    def get_queryset(self):
        user = self.request.user
        qs = SensorReading.objects.select_related('device__field__farm', 'device__field__farm__farmer')
        if user.is_admin_user:
            return qs.all()
        return qs.filter(device__field__farm__farmer=user)

    @action(detail=False, methods=['get'])
    def history(self, request):
        serializer = SensorHistorySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        params = serializer.validated_data

        qs = self.get_queryset()
        if params.get('device'):
            qs = qs.filter(device_id=params['device'])
        if params.get('field'):
            qs = qs.filter(device__field_id=params['field'])
        if params.get('reading_type'):
            qs = qs.filter(reading_type=params['reading_type'])

        days = params.get('days', 7)
        since = timezone.now() - timedelta(days=days)
        qs = qs.filter(timestamp__gte=since).order_by('timestamp')[:500]

        return Response(SensorReadingSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def aggregate(self, request):
        qs = self.get_queryset()
        limit = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=limit)
        qs = qs.filter(timestamp__gte=since)

        result = {'daily_averages': OrderedDict(), 'current': {}, 'overall': {}}
        from django.db.models import Avg, Count, Max, Min
        aggregations = qs.aggregate(avg=Avg('value'), min=Min('value'), max=Max('value'), count=Count('id'))
        result['overall'] = {
            'avg': round(aggregations['avg'], 2) if aggregations['avg'] else None,
            'min': aggregations['min'],
            'max': aggregations['max'],
            'count': aggregations['count'],
        }
        for reading_type in ['SOIL_MOISTURE', 'TEMPERATURE', 'HUMIDITY']:
            sub = qs.filter(reading_type=reading_type)
            agg = sub.aggregate(avg=Avg('value'), min=Min('value'), max=Max('value'), count=Count('id'))
            latest = sub.order_by('-timestamp').first()
            result['current'][reading_type] = {
                'latest': latest.value if latest else None,
                'avg': round(agg['avg'], 2) if agg['avg'] else None,
                'min': agg['min'],
                'max': agg['max'],
                'count': agg['count'],
            }
        return Response(result)