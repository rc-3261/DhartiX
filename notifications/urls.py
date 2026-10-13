from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MarkAllReadView,
    MarkReadView,
    NotificationViewSet,
    UnreadCountView,
)

router = DefaultRouter()
router.register('notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('notifications/mark-all-read/', MarkAllReadView.as_view(), name='mark-all-read'),
    path('notifications/mark-read/', MarkReadView.as_view(), name='mark-read'),
    path('notifications/unread-count/', UnreadCountView.as_view(), name='unread-count'),
    path('', include(router.urls)),
]