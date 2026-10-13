from rest_framework import serializers

from .models import Product, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'product_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.username', read_only=True)
    farmer_farm = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'farmer', 'farmer_name', 'farmer_farm', 'category', 'category_name',
                  'name', 'description', 'price', 'quantity', 'unit', 'image', 'image_url',
                  'location', 'availability', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'farmer', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return None

    def get_farmer_farm(self, obj):
        profile = getattr(obj.farmer, 'farmer_profile', None)
        return profile.farm_name if profile else ''


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'farmer', 'category', 'name', 'description', 'price',
                  'quantity', 'unit', 'image', 'location', 'availability', 'status']
        read_only_fields = ['id', 'farmer']

    def validate(self, attrs):
        if 'price' in attrs and attrs['price'] < 0:
            raise serializers.ValidationError({'price': 'Price cannot be negative.'})
        if 'quantity' in attrs and attrs['quantity'] < 0:
            raise serializers.ValidationError({'quantity': 'Quantity cannot be negative.'})
        return attrs