from rest_framework import serializers

from .models import Crop, CropCycle


class CropCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CropCycle
        fields = ['id', 'crop', 'stage', 'notes', 'date']


class CropSerializer(serializers.ModelSerializer):
    field_name = serializers.CharField(source='field.name', read_only=True)
    farm = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()
    cycles = CropCycleSerializer(many=True, read_only=True)

    class Meta:
        model = Crop
        fields = ['id', 'field', 'field_name', 'farm', 'farm_name', 'name', 'variety',
                  'planting_date', 'expected_harvest_date', 'actual_harvest_date',
                  'current_growth_stage', 'quantity', 'quantity_unit', 'status',
                  'notes', 'cycles', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_farm(self, obj):
        return obj.field.farm_id

    def get_farm_name(self, obj):
        return obj.field.farm.name