import os

from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Product, ProductCategory
from .serializers import (
    ProductCategorySerializer,
    ProductCreateUpdateSerializer,
    ProductSerializer,
)


def validate_product_image(image):
    if image.size > settings.MAX_IMAGE_UPLOAD_SIZE:
        raise ValidationError('Image file too large. Maximum size is 5 MB.')
    ext = os.path.splitext(image.name)[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.webp', '.gif'):
        raise ValidationError('Unsupported image format.')


class ProductCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    search_fields = ['name']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return ProductCategory.objects.all()

    def create(self, request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_admin_user):
            return Response({'detail': 'Only admins can create categories.'}, status=403)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_admin_user):
            return Response({'detail': 'Only admins can update categories.'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_admin_user):
            return Response({'detail': 'Only admins can delete categories.'}, status=403)
        return super().destroy(request, *args, **kwargs)


class ProductViewSet(viewsets.ModelViewSet):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    search_fields = ['name', 'description', 'category__name', 'location']
    ordering_fields = ['price', 'name', 'created_at']
    filterset_fields = ['category', 'availability', 'farmer', 'status']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def check_permissions(self, request):
        super().check_permissions(request)
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            if not (request.user.is_admin_user or request.user.is_farmer):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Only farmers can manage products.')

    def get_queryset(self):
        qs = Product.objects.select_related('farmer', 'category').all()
        user = self.request.user
        if not user.is_authenticated:
            return qs.filter(status='PUBLISHED', availability=True)
        if user.is_farmer:
            return qs.filter(farmer=user)
        if user.is_admin_user:
            return qs
        return qs.filter(status='PUBLISHED', availability=True)

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ('PUT', 'PATCH', 'DELETE') and not (
            request.user.is_admin_user or (request.user.is_farmer and obj.farmer_id == request.user.id)
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to modify this product.')

    def perform_create(self, serializer):
        image = self.request.FILES.get('image')
        if image:
            validate_product_image(image)
        serializer.save(farmer=self.request.user)

    def perform_update(self, serializer):
        image = self.request.FILES.get('image')
        if image:
            validate_product_image(image)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.delete()
        return Response({'detail': 'Product deleted successfully.'})