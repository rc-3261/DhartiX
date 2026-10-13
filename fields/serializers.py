from rest_framework import serializers

from crops.models import Crop
from crops.serializers import CropSerializer

from .models import Field


class FieldSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    farmer = serializers.SerializerMethodField()
    crop_count = serializers.SerializerMethodField()
    crops = serializers.SerializerMethodField()

    class Meta:
        model = Field
        fields = ['id', 'farm', 'farm_name', 'farmer', 'name', 'area', 'area_unit',
                  'soil_type', 'irrigation_type', 'location', 'status',
                  'created_at', 'updated_at', 'crop_count', 'crops']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_farmer(self, obj):
        return obj.farm.farmer_id

    def get_crop_count(self, obj):
        return obj.crops.count()

    def get_crops(self, obj):
        return CropSerializer(obj.crops.all(), many=True).data