from rest_framework import serializers
from .models import Master, Order

class MasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Master
        fields = ['id', 'latitude', 'longitude', 'first_name', 'last_name', 'rating', 'label']
