from rest_framework.routers import DefaultRouter

from .views import ProductCategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register('products', ProductViewSet, basename='products')
router.register('categories', ProductCategoryViewSet, basename='categories')

urlpatterns = router.urls