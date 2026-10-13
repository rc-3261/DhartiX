from django.db import models


class Crop(models.Model):
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('GROWING', 'Growing'),
        ('READY', 'Ready for Harvest'),
        ('HARVESTED', 'Harvested'),
    ]
    GROWTH_STAGES = [
        ('PREPARATION', 'Preparation'),
        ('GERMINATION', 'Germination'),
        ('SEEDLING', 'Seedling'),
        ('VEGETATIVE', 'Vegetative'),
        ('FLOWERING', 'Flowering'),
        ('FRUITING', 'Fruiting'),
        ('MATURITY', 'Maturity'),
        ('HARVESTED', 'Harvested'),
    ]
    field = models.ForeignKey('fields.Field', on_delete=models.CASCADE, related_name='crops')
    name = models.CharField(max_length=150)
    variety = models.CharField(max_length=150, blank=True)
    planting_date = models.DateField(blank=True, null=True)
    expected_harvest_date = models.DateField(blank=True, null=True)
    actual_harvest_date = models.DateField(blank=True, null=True)
    current_growth_stage = models.CharField(max_length=20, choices=GROWTH_STAGES, default='PREPARATION')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_unit = models.CharField(max_length=20, default='kg')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} @ {self.field.name}'


class CropCycle(models.Model):
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='cycles')
    stage = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f'{self.crop.name} - {self.stage}'