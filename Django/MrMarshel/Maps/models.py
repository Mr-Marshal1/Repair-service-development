from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Master(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    rating = models.FloatField(default=0.0)
    label = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'В очікуванні'),
        ('inProcess', 'В обробці'),
        ('completed', 'Завершено'),
    )
    master = models.ForeignKey(Master, on_delete=models.CASCADE)
    address = models.CharField(max_length=255)
    customer_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)

class PhoneVerification(models.Model):
    phone = models.CharField(max_length=15)
    verification_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.phone} - {self.verification_code}'