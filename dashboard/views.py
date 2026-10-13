from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser, IsBuyer, IsFarmer

from . import services


class FarmerDashboardView(APIView):
    permission_classes = [IsFarmer]

    def get(self, request):
        return Response(services.farmer_dashboard(request.user))


class BuyerDashboardView(APIView):
    permission_classes = [IsBuyer]

    def get(self, request):
        return Response(services.buyer_dashboard(request.user))


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(services.admin_dashboard())