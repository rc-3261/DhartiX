from django.contrib import admin

from .models import SensorDevice, SensorReading


@admin.register(SensorDevice)
class SensorDeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'device_type', 'field', 'status', 'last_reading_at')
    list_filter = ('device_type', 'status')
    search_fields = ('name', 'device_id', 'field__name')


@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ('device', 'reading_type', 'value', 'unit', 'timestamp')
    list_filter = ('reading_type',)
    search_fields = ('device__name',)