from rest_framework.routers import DefaultRouter

from .views import ComplaintViewSet

router = DefaultRouter()
router.register('complaints', ComplaintViewSet, basename='complaints')

urlpatterns = router.urls