from rest_framework import serializers

from .models import AIConversation, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'conversation', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class AIConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = ['id', 'farmer', 'title', 'message_count', 'last_message',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'farmer', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return AIMessageSerializer(msg).data if msg else None


class ChatSerializer(serializers.Serializer):
    message = serializers.CharField()
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True)
    soil_type = serializers.CharField(required=False, allow_blank=True)
    soil_moisture = serializers.FloatField(required=False, allow_null=True)
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    crop = serializers.CharField(required=False, allow_blank=True)
    crop_stage = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    season = serializers.CharField(required=False, allow_blank=True)


class CropRecommendationSerializer(serializers.Serializer):
    soil_type = serializers.CharField(required=False, allow_blank=True)
    soil_moisture = serializers.FloatField(required=False, allow_null=True)
    temperature = serializers.FloatField(required=False, allow_null=True)
    humidity = serializers.FloatField(required=False, allow_null=True)
    location = serializers.CharField(required=False, allow_blank=True)
    season = serializers.CharField(required=False, allow_blank=True)
    available_water = serializers.CharField(required=False, allow_blank=True)
    limit = serializers.IntegerField(required=False, default=5, min_value=1, max_value=10)


class FertilizerRecommendationSerializer(serializers.Serializer):
    crop = serializers.CharField(required=False, allow_blank=True)
    crop_stage = serializers.CharField(required=False, allow_blank=True)
    soil_type = serializers.CharField(required=False, allow_blank=True)
    soil_moisture = serializers.FloatField(required=False, allow_null=True)
    nitrogen = serializers.FloatField(required=False, allow_null=True)
    phosphorus = serializers.FloatField(required=False, allow_null=True)
    potassium = serializers.FloatField(required=False, allow_null=True)


class IrrigationRecommendationSerializer(serializers.Serializer):
    soil_moisture = serializers.FloatField(required=False, allow_null=True)
    temperature = serializers.FloatField(required=False, allow_null=True)
    crop = serializers.CharField(required=False, allow_blank=True)
    last_irrigation = serializers.CharField(required=False, allow_blank=True)