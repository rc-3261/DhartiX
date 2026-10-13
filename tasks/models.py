from django.db import models


class Task(models.Model):
    TASK_TYPES = [
        ('IRRIGATION', 'Irrigation'),
        ('FERTILIZER', 'Fertilizer'),
        ('PEST_INSPECTION', 'Pest Inspection'),
        ('CROP_INSPECTION', 'Crop Inspection'),
        ('HARVESTING', 'Harvesting'),
        ('EQUIPMENT_MAINTENANCE', 'Equipment Maintenance'),
        ('OTHER', 'Other'),
    ]
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]
    farmer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='tasks')
    farm = models.ForeignKey('farms.Farm', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    field = models.ForeignKey('fields.Field', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    crop = models.ForeignKey('crops.Crop', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    task_type = models.CharField(max_length=30, choices=TASK_TYPES, default='OTHER')
    due_date = models.DateField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date', '-created_at']

    def __str__(self):
        return self.title