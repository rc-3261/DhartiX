"""Weather service. Uses OpenWeatherMap if WEATHER_API_KEY is set, otherwise
returns clean mock/demo data so the application never breaks.
"""

import random
from datetime import datetime, timedelta

import requests
from django.conf import settings


class WeatherService:
    def __init__(self, location=''):
        self.location = location or 'Generic Farm'

    def get_current(self):
        data = self._fetch_api()
        if data:
            return data
        return self._mock_current()

    def get_forecast(self, days=5):
        data = self._fetch_api(days)
        if data:
            return data
        return self._mock_forecast(days)

    def _fetch_api(self, days=None):
        if not settings.WEATHER_API_KEY:
            return None
        try:
            url = 'https://api.openweathermap.org/data/2.5/weather'
            params = {'q': self.location, 'appid': settings.WEATHER_API_KEY, 'units': 'metric'}
            resp = requests.get(url, params=params, timeout=15)
            resp.raise_for_status()
            json_data = resp.json()
            return {
                'location': self.location,
                'temperature': round(json_data['main']['temp'], 1),
                'humidity': json_data['main']['humidity'],
                'condition': json_data['weather'][0]['description'].title(),
                'wind_speed': round(json_data['wind']['speed'], 1),
                'rain_probability': None,
                'source': 'openweathermap',
                'recorded_at': datetime.now().isoformat(),
            }
        except Exception:
            return None

    def _mock_current(self):
        random.seed(hash(self.location) % 10 ** 8)
        return {
            'location': self.location,
            'temperature': round(random.uniform(18, 36), 1),
            'humidity': round(random.uniform(35, 85), 0),
            'rain_probability': round(random.uniform(0, 40), 0),
            'condition': random.choice(['Sunny', 'Partly Cloudy', 'Clear Sky', 'Light Rain', 'Cloudy']),
            'wind_speed': round(random.uniform(2, 20), 1),
            'source': 'mock',
            'recorded_at': datetime.now().isoformat(),
        }

    def _mock_forecast(self, days):
        random.seed(hash(self.location) % 10 ** 8)
        base = self._mock_current()
        forecast = []
        for i in range(1, days + 1):
            forecast.append({
                'date': (datetime.now() + timedelta(days=i)).date().isoformat(),
                'temperature': round(base['temperature'] + random.uniform(-4, 4), 1),
                'humidity': round(min(max(base['humidity'] + random.uniform(-15, 15), 20), 95), 0),
                'rain_probability': round(min(max(base['rain_probability'] + random.uniform(-20, 25), 0), 100), 0),
                'condition': random.choice(['Sunny', 'Partly Cloudy', 'Clear Sky', 'Light Rain', 'Cloudy', 'Thunderstorm']),
                'wind_speed': round(random.uniform(2, 20), 1),
            })
        return {'location': self.location, 'forecast': forecast, 'source': 'mock'}


def get_weather_service(location=''):
    return WeatherService(location)