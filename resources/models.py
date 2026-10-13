from django.db import models


class Resource(models.Model):
    CATEGORY_CHOICES = [
        ('SEED', 'Seeds'),
        ('FERTILIZER', 'Fertilizers'),
        ('PESTICIDE', 'Pesticides'),
        ('TOOL', 'Tools'),
        ('EQUIPMENT', 'Equipment'),
        ('OTHER', 'Other'),
    ]
    farmer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='resources')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=20, default='kg')
    purchase_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold