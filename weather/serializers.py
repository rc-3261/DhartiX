from rest_framework import serializers

from .models import WeatherRecord


class WeatherRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherRecord
        fields = ['id', 'field', 'location', 'temperature', 'humidity',
                  'rain_probability', 'condition', 'wind_speed', 'source', 'recorded_at']


class WeatherQuerySerializer(serializers.Serializer):
    location = serializers.CharField(required=False, allow_blank=True)
    days = serializers.IntegerField(required=False, min_value=1, max_value=10, default=5)