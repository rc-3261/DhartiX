from django.contrib import admin

from .models import Resource


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'category', 'quantity', 'unit', 'expiry_date', 'cost')
    list_filter = ('category',)
    search_fields = ('name', 'farmer__username')