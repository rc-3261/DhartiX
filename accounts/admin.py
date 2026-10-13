from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import BuyerProfile, FarmerProfile, User


class FarmerProfileInline(admin.StackedInline):
    model = FarmerProfile
    can_delete = False


class BuyerProfileInline(admin.StackedInline):
    model = BuyerProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('DhartiX Profile', {'fields': ('role', 'phone', 'avatar', 'is_verified')}),
    )


admin.site.register(FarmerProfile)
admin.site.register(BuyerProfile)