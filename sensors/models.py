from django.db import models


class SensorDevice(models.Model):
    DEVICE_TYPES = [
        ('SOIL_MOISTURE', 'Soil Moisture'),
        ('TEMPERATURE', 'Temperature'),
        ('HUMIDITY', 'Humidity'),
    ]
    STATUS_CHOICES = [
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('WARNING', 'Warning'),
    ]
    field = models.ForeignKey('fields.Field', on_delete=models.CASCADE, related_name='sensors')
    name = models.CharField(max_length=150)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    device_id = models.CharField(max_length=100, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OFFLINE')
    location = models.CharField(max_length=250, blank=True)
    battery_level = models.IntegerField(default=100)
    last_reading_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.device_type})'

    @property
    def farmer(self):
        return self.field.farm.farmer


class SensorReading(models.Model):
    READING_TYPES = [
        ('SOIL_MOISTURE', 'Soil Moisture'),
        ('TEMPERATURE', 'Temperature'),
        ('HUMIDITY', 'Humidity'),
    ]
    device = models.ForeignKey(SensorDevice, on_delete=models.CASCADE, related_name='readings')
    reading_type = models.CharField(max_length=20, choices=READING_TYPES)
    value = models.FloatField()
    unit = models.CharField(max_length=20, default='%')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.device.name}: {self.value}{self.unit} @ {self.timestamp}'