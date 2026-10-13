from django.urls import path

from .views import (
    CropReportView,
    FarmReportView,
    ResourceReportView,
    SalesReportView,
    SensorReportView,
)

urlpatterns = [
    path('reports/farm/', FarmReportView.as_view(), name='report-farm'),
    path('reports/crop/', CropReportView.as_view(), name='report-crop'),
    path('reports/sensor/', SensorReportView.as_view(), name='report-sensor'),
    path('reports/sales/', SalesReportView.as_view(), name='report-sales'),
    path('reports/resource/', ResourceReportView.as_view(), name='report-resource'),
]