from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('INFO', 'Info'),
        ('SOIL_MOISTURE', 'Low Soil Moisture'),
        ('SENSOR_OFFLINE', 'Sensor Offline'),
        ('TASK_DUE', 'Task Due'),
        ('NEW_ORDER', 'New Order'),
        ('ORDER_STATUS', 'Order Status'),
        ('LOW_STOCK', 'Low Inventory'),
        ('PRODUCT_SOLD', 'Product Sold'),
        ('WEATHER', 'Weather Alert'),
    ]
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title