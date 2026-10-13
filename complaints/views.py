from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Complaint
from .serializers import ComplaintSerializer


class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['subject', 'description', 'status', 'complaint_type']
    ordering_fields = ['created_at', 'status', 'complaint_type']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user:
            return Complaint.objects.select_related('user').all()
        return Complaint.objects.filter(user=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if not request.user.is_admin_user and obj.user_id != request.user.id:
            raise PermissionDenied('You do not have access to this complaint.')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        if not user.is_admin_user and 'status' in self.request.data and \
                self.request.data.get('status') != 'OPEN':
            raise PermissionDenied('Only admins can update complaint status or responses.')
        serializer.save()


class AdminComplaintResponseView(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Complaint.objects.all()

    def partial_update(self, request, pk=None):
        complaint = self.get_object()
        if not request.user.is_admin_user:
            raise PermissionDenied('Only admins can respond to complaints.')
        status_value = request.data.get('status')
        response_text = request.data.get('admin_response')
        if status_value:
            complaint.status = status_value
        if response_text is not None:
            complaint.admin_response = response_text
        complaint.save()
        return Response(ComplaintSerializer(complaint).data)