from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'farmer', 'task_type', 'priority', 'status', 'due_date')
    list_filter = ('task_type', 'priority', 'status')
    search_fields = ('title', 'description', 'farmer__username')