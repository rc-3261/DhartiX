from rest_framework import serializers

from .models import Resource


class ResourceSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    months_to_expiry = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = ['id', 'farmer', 'name', 'category', 'quantity', 'unit',
                  'purchase_date', 'expiry_date', 'cost', 'low_stock_threshold',
                  'is_low_stock', 'months_to_expiry', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'farmer', 'created_at', 'updated_at']

    def get_months_to_expiry(self, obj):
        from datetime import date
        if not obj.expiry_date:
            return None
        return (obj.expiry_date - date.today()).days