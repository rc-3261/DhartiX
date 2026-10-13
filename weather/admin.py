from django.contrib import admin

from .models import WeatherRecord


@admin.register(WeatherRecord)
class WeatherRecordAdmin(admin.ModelAdmin):
    list_display = ('location', 'temperature', 'humidity', 'condition', 'recorded_at')
    list_filter = ('condition', 'source')
    search_fields = ('location',)