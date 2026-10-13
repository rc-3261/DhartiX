from django.urls import include, path
from rest_framework import routers

from .views import CurrentWeatherView, ForecastView, WeatherHistoryView

urlpatterns = [
    path('weather/current/', CurrentWeatherView.as_view(), name='weather-current'),
    path('weather/forecast/', ForecastView.as_view(), name='weather-forecast'),
    path('weather/history/', WeatherHistoryView.as_view(), name='weather-history'),
]