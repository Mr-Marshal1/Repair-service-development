from django.test import TestCase
from django.contrib.auth.models import User
from .models import Master, Order, PhoneVerification
from django.urls import reverse
from rest_framework.test import APIClient

class MasterModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.master = Master.objects.create(user=self.user, latitude=50.45, longitude=30.52, first_name='John', last_name='Doe', rating=4.5, label='master1')
    
    def test_master_creation(self):
        self.assertEqual(self.master.user, self.user)
        self.assertEqual(self.master.latitude, 50.45)
        self.assertEqual(self.master.longitude, 30.52)
        self.assertEqual(self.master.first_name, 'John')
        self.assertEqual(self.master.last_name, 'Doe')
        self.assertEqual(self.master.rating, 4.5)
        self.assertEqual(self.master.label, 'master1')

class OrderModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.master = Master.objects.create(user=self.user, latitude=50.45, longitude=30.52, first_name='John', last_name='Doe', rating=4.5, label='master1')
        self.order = Order.objects.create(master=self.master, address='123 Test St', customer_name='Jane Doe', phone_number='1234567890', description='Test order', status='pending')
    
    def test_order_creation(self):
        self.assertEqual(self.order.master, self.master)
        self.assertEqual(self.order.address, '123 Test St')
        self.assertEqual(self.order.customer_name, 'Jane Doe')
        self.assertEqual(self.order.phone_number, '1234567890')
        self.assertEqual(self.order.description, 'Test order')
        self.assertEqual(self.order.status, 'pending')

class PhoneVerificationModelTest(TestCase):
    def setUp(self):
        self.phone_verification = PhoneVerification.objects.create(phone='1234567890', verification_code='123456', is_verified=False)
    
    def test_phone_verification_creation(self):
        self.assertEqual(self.phone_verification.phone, '1234567890')
        self.assertEqual(self.phone_verification.verification_code, '123456')
        self.assertFalse(self.phone_verification.is_verified)

class MasterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.master = Master.objects.create(user=self.user, latitude=50.45, longitude=30.52, first_name='John', last_name='Doe', rating=4.5, label='master1')
    
    def test_get_master_status(self):
        url = reverse('master-status', kwargs={'pk': self.master.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'has_inprocess_orders': False})

class OrderViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.master = Master.objects.create(user=self.user, latitude=50.45, longitude=30.52, first_name='John', last_name='Doe', rating=4.5, label='master1')
        PhoneVerification.objects.create(phone='1234567890', verification_code='123456', is_verified=True)

    def test_create_order(self):
        url = reverse('create_order')
        data = {
            'master_label': 'master1',
            'address': '123 Test St',
            'customer_name': 'Jane Doe',
            'phone_number': '1234567890',
            'description': 'Test order'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {'message': 'Order created successfully'})

class PhoneVerificationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_verify_code(self):
        PhoneVerification.objects.create(phone='1234567890', verification_code='123456', is_verified=False)
        url = reverse('verify_code')
        data = {'phone': '1234567890', 'verification_code': '123456'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 200)
        verification = PhoneVerification.objects.get(phone='1234567890')
        self.assertTrue(verification.is_verified)