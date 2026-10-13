from rest_framework import serializers

from .models import SensorDevice, SensorReading


class SensorReadingSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    field = serializers.SerializerMethodField()

    class Meta:
        model = SensorReading
        fields = ['id', 'device', 'device_name', 'field', 'reading_type', 'value',
                  'unit', 'timestamp']
        read_only_fields = ['id', 'timestamp']

    def get_field(self, obj):
        return obj.device.field_id


class SensorReadingCreateSerializer(serializers.Serializer):
    device_id = serializers.CharField(required=False, allow_blank=True)
    device_name = serializers.CharField(required=False, allow_blank=True)
    field_id = serializers.IntegerField(required=False, allow_null=True)
    sensor_type = serializers.CharField(required=False, allow_blank=True)
    reading_type = serializers.CharField(required=True)
    value = serializers.FloatField(required=True)
    unit = serializers.CharField(required=False, allow_blank=True)


class SensorDeviceSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='field.name', read_only=True)
    farm = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()
    farmer = serializers.SerializerMethodField()
    latest_reading = serializers.SerializerMethodField()
    today_stats = serializers.SerializerMethodField()

    class Meta:
        model = SensorDevice
        fields = ['id', 'field', 'field_name', 'farm', 'farm_name', 'farmer', 'name',
                  'device_type', 'device_id', 'status', 'location', 'battery_level',
                  'last_reading_at', 'latest_reading', 'today_stats', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_farm(self, obj):
        return obj.field.farm_id

    def get_farm_name(self, obj):
        return obj.field.farm.name

    def get_farmer(self, obj):
        return obj.field.farm.farmer_id

    def get_latest_reading(self, obj):
        reading = obj.readings.first()
        return SensorReadingSerializer(reading).data if reading else None

    def get_today_stats(self, obj):
        from datetime import timedelta
        from django.utils import timezone
        readings = obj.readings.filter(timestamp__gte=timezone.now() - timedelta(days=1))
        if not readings.exists():
            return {'min': None, 'max': None, 'avg': None, 'count': 0, 'latest': None}
        values = [r.value for r in readings]
        return {
            'min': min(values),
            'max': max(values),
            'avg': round(sum(values) / len(values), 2),
            'count': len(values),
            'latest': values[-1],
        }


class SensorHistorySerializer(serializers.Serializer):
    device = serializers.IntegerField(required=False)
    field = serializers.IntegerField(required=False)
    reading_type = serializers.CharField(required=False, allow_blank=True)
    days = serializers.IntegerField(required=False, min_value=1, max_value=90, default=7)