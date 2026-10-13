from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CartItemView,
    CartView,
    CheckoutView,
    ClearCartView,
    FarmerOrdersView,
    MyOrdersView,
    OrderItemListForFarmerView,
    OrderViewSet,
)

router = DefaultRouter()
router.register('orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/clear/', ClearCartView.as_view(), name='cart-clear'),
    path('cart/items/<int:item_id>/', CartItemView.as_view(), name='cart-item'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('my-orders/', MyOrdersView.as_view(), name='my-orders'),
    path('farmer-orders/', FarmerOrdersView.as_view(), name='farmer-orders'),
    path('farmer-order-items/', OrderItemListForFarmerView.as_view(), name='farmer-order-items'),
]