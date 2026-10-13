from django.contrib import admin

from .models import Crop, CropCycle


class CropCycleInline(admin.TabularInline):
    model = CropCycle
    extra = 0


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ('name', 'field', 'status', 'current_growth_stage', 'planting_date', 'expected_harvest_date')
    list_filter = ('status', 'current_growth_stage')
    search_fields = ('name', 'variety', 'field__name')
    inlines = [CropCycleInline]


@admin.register(CropCycle)
class CropCycleAdmin(admin.ModelAdmin):
    list_display = ('crop', 'stage', 'date')