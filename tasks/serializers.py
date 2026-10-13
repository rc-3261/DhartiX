from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True, default=None)
    field_name = serializers.CharField(source='field.name', read_only=True, default=None)
    crop_name = serializers.CharField(source='crop.name', read_only=True, default=None)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'farmer', 'farm', 'farm_name', 'field', 'field_name', 'crop',
                  'crop_name', 'title', 'description', 'task_type', 'due_date',
                  'priority', 'status', 'is_overdue', 'created_at', 'updated_at']
        read_only_fields = ['id', 'farmer', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        from datetime import date
        return bool(obj.due_date and obj.status not in ('COMPLETED',) and obj.due_date < date.today())