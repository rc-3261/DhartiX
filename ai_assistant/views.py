from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import AIConversation, AIMessage
from .serializers import (
    AIConversationSerializer,
    AIMessageSerializer,
    ChatSerializer,
    CropRecommendationSerializer,
    FertilizerRecommendationSerializer,
    IrrigationRecommendationSerializer,
)


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        conversation = None
        if data.get('conversation_id'):
            conversation = AIConversation.objects.filter(
                pk=data['conversation_id'], farmer=request.user).first()
        if not conversation:
            title = data.get('title') or (data['message'][:50] + '...')
            conversation = AIConversation.objects.create(farmer=request.user, title=title)

        user_msg = AIMessage.objects.create(
            conversation=conversation, role='USER', content=data['message'])

        context = {
            'soil_type': data.get('soil_type'),
            'soil_moisture': data.get('soil_moisture'),
            'temperature': data.get('temperature'),
            'humidity': data.get('humidity'),
            'crop': data.get('crop'),
            'crop_stage': data.get('crop_stage'),
            'location': data.get('location'),
            'season': data.get('season'),
        }
        try:
            response_text = services.chat_response(data['message'], context)
        except Exception:
            response_text = (
                "I'm sorry, the AI service is temporarily unavailable. "
                "Please try again in a moment."
            )

        assistant_msg = AIMessage.objects.create(
            conversation=conversation, role='ASSISTANT', content=response_text)
        conversation.save()

        return Response({
            'conversation': AIConversationSerializer(conversation).data,
            'message': AIMessageSerializer(user_msg).data,
            'response': AIMessageSerializer(assistant_msg).data,
        })


class AIConversationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(farmer=self.request.user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if obj.farmer_id != request.user.id:
            raise PermissionDenied('You do not have access to this conversation.')

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        return Response(AIMessageSerializer(conversation.messages.all(), many=True).data)


class CropRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CropRecommendationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data['limit'] = data.get('limit', 5)
        try:
            result = services.crop_recommendation_service(data)
        except Exception:
            return Response({'error': 'AI service unavailable. Try again later.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(result)


class FertilizerRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FertilizerRecommendationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = services.fertilizer_recommendation_service(dict(serializer.validated_data))
        except Exception:
            return Response({'error': 'AI service unavailable. Try again later.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(result)


class IrrigationRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = IrrigationRecommendationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = services.irrigation_recommendation_service(dict(serializer.validated_data))
        except Exception:
            return Response({'error': 'AI service unavailable. Try again later.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(result)