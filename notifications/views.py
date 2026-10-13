from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class MarkAllReadView(APIView):
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class MarkReadView(APIView):
    def post(self, request):
        notification_id = request.data.get('notification_id')
        if not notification_id:
            return Response({'detail': 'notification_id is required.'}, status=400)
        Notification.objects.filter(id=notification_id, user=request.user).update(is_read=True)
        return Response({'detail': 'Notification marked as read.'})


class UnreadCountView(APIView):
    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})