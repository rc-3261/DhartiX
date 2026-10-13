from django.contrib import admin

from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user', 'complaint_type', 'status', 'created_at')
    list_filter = ('complaint_type', 'status')
    search_fields = ('subject', 'description', 'user__username')