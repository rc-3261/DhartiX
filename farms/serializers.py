from rest_framework import serializers

from .models import Farm


class FarmSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.username', read_only=True)
    field_count = serializers.SerializerMethodField()
    crop_count = serializers.SerializerMethodField()
    active_crop_count = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = ['id', 'farmer', 'farmer_name', 'name', 'location', 'area',
                  'area_unit', 'soil_type', 'irrigation_type', 'created_at',
                  'updated_at', 'field_count', 'crop_count', 'active_crop_count']
        read_only_fields = ['id', 'farmer', 'created_at', 'updated_at']

    def get_field_count(self, obj):
        return obj.fields.count()

    def get_crop_count(self, obj):
        return sum(f.crops.count() for f in obj.fields.all())

    def get_active_crop_count(self, obj):
        count = 0
        for f in obj.fields.all():
            count += f.crops.exclude(status__in=['HARVESTED', 'PLANNED']).count()
        return count