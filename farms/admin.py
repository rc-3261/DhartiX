from django.contrib import admin

from .models import Farm


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'location', 'area', 'soil_type', 'created_at')
    list_filter = ('soil_type', 'irrigation_type')
    search_fields = ('name', 'location', 'farmer__username')