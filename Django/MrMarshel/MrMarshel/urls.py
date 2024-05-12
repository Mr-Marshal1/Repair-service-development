"""
URL configuration for MrMarshel project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from Maps.views import MasterListCreateAPIView, MasterRetrieveUpdateDestroyAPIView, create_order, get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('masters/', MasterListCreateAPIView.as_view(), name='master-list-create'),
    path('masters/<int:pk>/', MasterRetrieveUpdateDestroyAPIView.as_view(), name='master-detail'),
    path('orders/', create_order, name='create_order'),
    path('get_csrf_token/', get_csrf_token, name='get_csrf_token'),
]