from rest_framework.routers import DefaultRouter

from .views import CropCycleViewSet, CropViewSet

router = DefaultRouter()
router.register('crops', CropViewSet, basename='crops')
router.register('crop-cycles', CropCycleViewSet, basename='crop-cycles')

urlpatterns = router.urls