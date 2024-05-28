from django.shortcuts import render, get_object_or_404, redirect
from django.middleware.csrf import get_token
from .models import Master, Order, PhoneVerification
from django.http import JsonResponse
from .serializers import MasterSerializer
from django.conf import settings
from rest_framework import generics
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
import json
import requests
import random

# Create your views here.

class MasterListCreateAPIView(generics.ListCreateAPIView):
    queryset = Master.objects.all()
    serializer_class = MasterSerializer

class MasterRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Master.objects.all()
    serializer_class = MasterSerializer

def get_master_status(request, pk):
    try:
        master = Master.objects.get(pk=pk)
    except Master.DoesNotExist:
        return JsonResponse({'error': 'Master not found'}, status=404)

    has_inprocess_orders = Order.objects.filter(master=master, status='inProcess').exists()

    return JsonResponse({'has_inprocess_orders': has_inprocess_orders})

#@method_decorator(csrf_protect, name='dispatch')
@csrf_exempt
# @ratelimit(key='ip', rate='3/m')
def create_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            order = Order()
            master_label = data.get('master_label')
            master = Master.objects.get(label=master_label)
            phone_number = data.get('phone_number')
            try:
                verification = PhoneVerification.objects.get(phone=phone_number, is_verified=True)
            except PhoneVerification.DoesNotExist:
                return JsonResponse({'error': 'Phone number is not verified'}, status=400)
            order.master = master
            order.address = data.get('address')
            order.customer_name = data.get('customer_name')
            order.phone_number = phone_number
            order.description = data.get('description')
            order.status = 'pending'
            order.save()
            return JsonResponse({'message': 'Order created successfully'}, status=201)
        except Master.DoesNotExist:
            return JsonResponse({'error': 'Master is not found'}, status=404)
    return JsonResponse({'error': 'Only POST requests are allowed'}, status=400)

def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})

@csrf_exempt
# @ratelimit(key='ip', rate='2/day')
def send_verification(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
            phone = body.get('phone')
            verification_code = random.randint(1000, 9999)
            message = f'Код підтвердження: {verification_code}'
            src_addr = 'REMONT'
            
            if not phone:
                return JsonResponse({'error': 'Phone number is required'}, status=400)

            data = {
                "phone": [phone],
                "message": message,
                "src_addr": src_addr
            }

            response = requests.post(settings.SMSCLUB_API_URL, headers=settings.SMSCLUB_API_HEADERS, json=data)
            response_data = response.json()

            if response.status_code == 200:
                PhoneVerification.objects.filter(phone=phone).delete()
                PhoneVerification.objects.create(phone=phone, verification_code=verification_code)

            return JsonResponse({
                'status_code': response.status_code,
                'response': response_data
            })

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

@csrf_exempt
# @ratelimit(key='ip', rate='3/m')
def verify_code(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
            phone = body.get('phone')
            verification_code = body.get('verification_code')

            if not phone or not verification_code:
                return JsonResponse({'error': 'Phone number and verification code are required'}, status=400)
            try:
                record = PhoneVerification.objects.get(phone=phone, verification_code=verification_code)
            except PhoneVerification.DoesNotExist:
                return JsonResponse({'error': 'Invalid phone number or verification code'}, status=400)
            if timezone.now() - record.created_at > timezone.timedelta(days=1):
                return JsonResponse({'error': 'Verification code has expired'}, status=400)
            record.is_verified = True
            record.save()
            return JsonResponse({'success': 'Verification successful'}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=400)