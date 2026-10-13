from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import WeatherQuerySerializer, WeatherRecordSerializer
from .services import get_weather_service


class CurrentWeatherView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        location = request.query_params.get('location', '')
        if not location:
            profile = getattr(request.user, 'farmer_profile', None)
            if profile and profile.location:
                location = profile.location
        weather = get_weather_service(location).get_current()
        return Response(weather)


class ForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = WeatherQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        location = serializer.validated_data.get('location', '')
        days = serializer.validated_data.get('days', 5)
        weather = get_weather_service(location).get_forecast(days)
        return Response(weather)


class WeatherHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        from weather.models import WeatherRecord
        field_id = request.query_params.get('field')
        location = request.query_params.get('location')
        qs = WeatherRecord.objects.all()
        if field_id:
            from fields.models import Field
            field = Field.objects.filter(pk=field_id).first()
            if field and (request.user.is_admin_user or field.farm.farmer_id == request.user.id):
                qs = qs.filter(field=field)
            else:
                qs = qs.none()
        if location:
            qs = qs.filter(location__icontains=location)
        qs = qs[:50]
        return Response(WeatherRecordSerializer(qs, many=True).data)