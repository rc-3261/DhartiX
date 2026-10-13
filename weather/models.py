from django.db import models


class WeatherRecord(models.Model):
    field = models.ForeignKey('fields.Field', on_delete=models.CASCADE, null=True, blank=True, related_name='weather_records')
    location = models.CharField(max_length=250, blank=True)
    temperature = models.FloatField(default=0)
    humidity = models.FloatField(default=0)
    rain_probability = models.FloatField(default=0)
    condition = models.CharField(max_length=100, blank=True)
    wind_speed = models.FloatField(default=0)
    source = models.CharField(max_length=50, default='mock')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f'{self.location or self.field}: {self.temperature}C {self.condition}'