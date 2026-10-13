"""
URL configuration for DhartiX project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('farms.urls')),
    path('api/', include('fields.urls')),
    path('api/', include('crops.urls')),
    path('api/', include('sensors.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('resources.urls')),
    path('api/ai/', include('ai_assistant.urls')),
    path('api/', include('marketplace.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('weather.urls')),
    path('api/', include('reports.urls')),
    path('api/', include('dashboard.urls')),
    path('api/', include('complaints.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)