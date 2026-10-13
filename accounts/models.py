from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('FARMER', 'Farmer'),
        ('BUYER', 'Buyer'),
        ('ADMIN', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='BUYER')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    @property
    def is_farmer(self):
        return self.role == 'FARMER'

    @property
    def is_buyer(self):
        return self.role == 'BUYER'

    @property
    def is_admin_user(self):
        return self.role == 'ADMIN' or self.is_superuser

    def __str__(self):
        return self.username


class FarmerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    farm_name = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=250, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f'{self.user.username} - {self.farm_name}'


class BuyerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyer_profile')
    address = models.CharField(max_length=250, blank=True)
    city = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f'{self.user.username} - Buyer'