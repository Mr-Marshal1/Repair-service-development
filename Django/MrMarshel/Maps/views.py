from django.shortcuts import render, get_object_or_404, redirect
from django.middleware.csrf import get_token
from .models import Master, Order
from django.http import JsonResponse
from .serializers import MasterSerializer
from rest_framework import generics
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
import json

# Create your views here.

class MasterListCreateAPIView(generics.ListCreateAPIView):
    queryset = Master.objects.all()
    serializer_class = MasterSerializer

class MasterRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Master.objects.all()
    serializer_class = MasterSerializer

#@method_decorator(csrf_protect, name='dispatch')
@csrf_exempt
def create_order(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        order = Order()
        try:
            master_label = data.get('master_label')
            master = Master.objects.get(label=master_label)
            order.master = master
            order.address = data.get('address')
            order.customer_name = data.get('customer_name')
            order.phone_number = data.get('phone_number')
            order.description = data.get('description')
            order.status = data.get('status')
            order.save()
            return JsonResponse({'message': 'Order created successfully'}, status=201)
        except Master.DoesNotExist:
            return JsonResponse({'error': 'Master not found'}, status=404)
    return JsonResponse({'error': 'Only POST requests are allowed'}, status=400)

def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})

# def get_csrf_token(request):
#     return JsonResponse({'csrfToken': str(request.COOKIES['csrftoken'])})