from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBuyer, IsFarmerOrAdmin
from marketplace.models import Product
from notifications.services import create_notification
from payments.services import get_gateway

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    AddToCartSerializer,
    CartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderItemSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    UpdateCartItemSerializer,
)


def get_buyer_cart(buyer):
    cart, _ = Cart.objects.get_or_create(buyer=buyer)
    return cart


class CartView(APIView):
    permission_classes = [IsBuyer]

    def get(self, request):
        cart = get_buyer_cart(request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = get_object_or_404(Product, pk=serializer.validated_data['product'],
                                    status='PUBLISHED', availability=True)
        quantity = serializer.validated_data['quantity']

        if product.quantity <= 0:
            return Response({'detail': 'This product is currently out of stock.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if quantity > product.quantity:
            return Response({'detail': f'Only {product.quantity} {product.unit} available.'},
                            status=status.HTTP_400_BAD_REQUEST)

        cart = get_buyer_cart(request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product,
            defaults={'quantity': quantity},
        )
        if not created:
            if cart_item.quantity + quantity > product.quantity:
                return Response({'detail': 'Not enough stock for the requested quantity.'},
                                status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity += quantity
            cart_item.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemView(APIView):
    permission_classes = [IsBuyer]

    def patch(self, request, item_id):
        cart = get_buyer_cart(request.user)
        cart_item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']
        if quantity > cart_item.product.quantity:
            return Response({'detail': 'Not enough stock available.'}, status=400)
        cart_item.quantity = quantity
        cart_item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        cart = get_buyer_cart(request.user)
        cart_item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        cart_item.delete()
        return Response(CartSerializer(cart).data)


class ClearCartView(APIView):
    permission_classes = [IsBuyer]

    def delete(self, request):
        cart = get_buyer_cart(request.user)
        cart.items.all().delete()
        return Response({'detail': 'Cart cleared.'})


class CheckoutView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_buyer_cart(request.user)
        items = CartItem.objects.select_related('product').filter(cart=cart)

        if not items.exists():
            return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = serializer.validated_data.get('payment_method', 'COD')
        total = sum(item.product.price * item.quantity for item in items)

        with transaction.atomic():
            order = Order.objects.create(
                buyer=request.user,
                total=total,
                shipping_address=serializer.validated_data.get('shipping_address', ''),
                payment_method=payment_method,
                notes=serializer.validated_data.get('notes', ''),
                status='PENDING',
            )

            payment_reference = ''
            if payment_method == 'ONLINE':
                gateway = get_gateway()
                payment = gateway.create_payment(order, total)
                payment_reference = payment.get('payment_reference', '')
                order.payment_reference = payment_reference
                order.payment_status = 'PAID'
                order.save(update_fields=['payment_reference', 'payment_status'])

            order_items = []
            for item in items:
                product = item.product
                if product.quantity < item.quantity:
                    raise ValueError(f'Not enough stock for {product.name}.')
                product.quantity -= item.quantity
                product.save(update_fields=['quantity', 'updated_at'])
                order_item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    farmer=product.farmer,
                    product_name=product.name,
                    quantity=item.quantity,
                    price=product.price,
                    status='PENDING',
                )
                order_items.append(order_item)
                create_notification(
                    product.farmer,
                    'New order received',
                    f'You have a new order for {item.quantity} {product.unit} of {product.name} (₹{product.price}/{product.unit}).',
                    'NEW_ORDER',
                )
            items.delete()

        data = OrderSerializer(order, context={'request': request}).data
        data['payment_reference_info'] = (
            {'gateway': 'mock', 'reference': payment_reference}
            if payment_method == 'ONLINE'
            else {'gateway': 'cod', 'reference': ''}
        )
        return Response(data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    search_fields = ['product_name', 'buyer__username', 'status', 'id']
    ordering_fields = ['created_at', 'total', 'status']

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related('items__product').select_related('buyer')
        if user.is_admin_user:
            return qs.all()
        if user.is_farmer:
            return qs.filter(items__farmer=user).distinct().order_by('-created_at')
        return qs.filter(buyer=user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.user.is_farmer:
            if not obj.items.filter(farmer=request.user).exists():
                raise PermissionDenied('You do not have access to this order.')
        elif request.user.is_buyer:
            if obj.buyer_id != request.user.id:
                raise PermissionDenied('You do not have access to this order.')
        elif not request.user.is_admin_user:
            raise PermissionDenied('You do not have access to this order.')

    @action(detail=True, methods=['post'])
    def update_item_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item_id = request.data.get('item_id')
        new_status = serializer.validated_data['status']

        item = order.items.filter(id=item_id).first()
        if not item:
            return Response({'detail': 'Order item not found.'}, status=404)

        if not (request.user.is_admin_user or item.farmer_id == request.user.id):
            raise PermissionDenied('You can only update status for your own products.')

        item.status = new_status
        item.save()

        # Derive the order status from item statuses (first non-delivered decides)
        statuses = set(order.items.values_list('status', flat=True))
        if statuses == {'DELIVERED'}:
            order.status = 'DELIVERED'
        elif 'CANCELLED' in statuses and len(statuses) == 1:
            order.status = 'CANCELLED'
        elif any(s in ('SHIPPED', 'PROCESSING', 'CONFIRMED') for s in statuses):
            order.status = next((s for s in ('CONFIRMED', 'PROCESSING', 'SHIPPED')
                                 if s in statuses), 'CONFIRMED')
        order.save()

        create_notification(
            order.buyer,
            'Order status updated',
            f'Your order #{order.id} ({item.product_name}) is now {new_status.replace("_", " ").title()}.',
            'ORDER_STATUS',
        )
        return Response(OrderSerializer(order, context={'request': request}).data)


class MyOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(buyer=request.user).prefetch_related('items')
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


class FarmerOrdersView(APIView):
    permission_classes = [IsFarmerOrAdmin]

    def get(self, request):
        user = request.user
        id_filter = request.query_params.get('status')
        qs = Order.objects.prefetch_related('items__product').select_related('buyer')
        if not user.is_admin_user:
            qs = qs.filter(items__farmer=user)
        if id_filter:
            qs = qs.filter(items__status=id_filter.upper())
        return Response(OrderSerializer(qs.distinct(), many=True, context={'request': request}).data)


class OrderItemListForFarmerView(APIView):
    permission_classes = [IsFarmerOrAdmin]

    def get(self, request):
        user = request.user
        qs = OrderItem.objects.select_related('product', 'order__buyer')
        if not user.is_admin_user:
            qs = qs.filter(farmer=user)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return Response(OrderItemSerializer(qs, many=True, context={'request': request}).data)