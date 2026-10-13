from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AIConversationViewSet,
    ChatView,
    CropRecommendationView,
    FertilizerRecommendationView,
    IrrigationRecommendationView,
)

router = DefaultRouter()
router.register('conversations', AIConversationViewSet, basename='ai-conversations')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatView.as_view(), name='ai-chat'),
    path('crop-recommendation/', CropRecommendationView.as_view(), name='crop-recommendation'),
    path('fertilizer-recommendation/', FertilizerRecommendationView.as_view(), name='fertilizer-recommendation'),
    path('irrigation-recommendation/', IrrigationRecommendationView.as_view(), name='irrigation-recommendation'),
]