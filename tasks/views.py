from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.permissions import IsFarmerOrAdmin

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsFarmerOrAdmin]
    search_fields = ['title', 'description', 'task_type', 'status', 'priority']
    ordering_fields = ['due_date', 'priority', 'status', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related('farm', 'field', 'crop').all()
        if user.is_admin_user:
            return qs
        return qs.filter(farmer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if not request.user.is_admin_user and obj.farmer_id != request.user.id:
            raise PermissionDenied('You do not have access to this task.')

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        task.delete()
        return Response({'detail': 'Task deleted successfully.'})