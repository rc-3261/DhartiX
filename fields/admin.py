from django.contrib import admin

from .models import Field


@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'farm', 'area', 'soil_type', 'status', 'created_at')
    list_filter = ('soil_type', 'irrigation_type', 'status')
    search_fields = ('name', 'farm__name')