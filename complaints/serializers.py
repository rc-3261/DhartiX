from rest_framework import serializers

from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Complaint
        fields = ['id', 'user', 'user_name', 'subject', 'description', 'complaint_type',
                  'status', 'admin_response', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']