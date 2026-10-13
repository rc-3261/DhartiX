from django.db import models


class Field(models.Model):
    SOIL_TYPES = [
        ('ALLUVIAL', 'Alluvial'),
        ('BLACK', 'Black'),
        ('RED', 'Red'),
        ('LATERITE', 'Laterite'),
        ('SANDY', 'Sandy'),
        ('CLAY', 'Clay'),
        ('LOAMY', 'Loamy'),
        ('SALINE', 'Saline'),
    ]
    IRRIGATION_TYPES = [
        ('DRIP', 'Drip'),
        ('SPRINKLER', 'Sprinkler'),
        ('FLOOD', 'Flood'),
        ('CANAL', 'Canal'),
        ('RAINFED', 'Rainfed'),
        ('MANUAL', 'Manual'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('IDLE', 'Idle'),
        ('PREPARING', 'Preparing'),
        ('RESTING', 'Resting'),
    ]
    farm = models.ForeignKey('farms.Farm', on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=200)
    area = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    area_unit = models.CharField(max_length=20, default='acres')
    soil_type = models.CharField(max_length=20, choices=SOIL_TYPES, blank=True)
    irrigation_type = models.CharField(max_length=20, choices=IRRIGATION_TYPES, blank=True)
    location = models.CharField(max_length=250, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.farm.name})'