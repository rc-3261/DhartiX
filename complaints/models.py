from django.db import models


class Complaint(models.Model):
    TYPE_CHOICES = [
        ('PRODUCT', 'Product Issue'),
        ('ORDER', 'Order Issue'),
        ('PAYMENT', 'Payment Issue'),
        ('ACCOUNT', 'Account Issue'),
        ('TECHNICAL', 'Technical Issue'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='complaints')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    complaint_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='OTHER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.subject