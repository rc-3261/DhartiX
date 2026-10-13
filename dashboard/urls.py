from django.urls import path

from .views import AdminDashboardView, BuyerDashboardView, FarmerDashboardView

urlpatterns = [
    path('dashboard/farmer/', FarmerDashboardView.as_view(), name='dashboard-farmer'),
    path('dashboard/buyer/', BuyerDashboardView.as_view(), name='dashboard-buyer'),
    path('dashboard/admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
]