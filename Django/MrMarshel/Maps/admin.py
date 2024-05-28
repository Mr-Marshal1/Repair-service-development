from django.contrib import admin
from django import forms
from .models import Master, Order, PhoneVerification

class MasterAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'display_rating']

    def display_rating(self, obj):
        rating_stars = '⭐️' * int(obj.rating)
        return rating_stars

class OrderAdminForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = '__all__'

class PhoneVerificationAdmin(admin.ModelAdmin):
    list_display = ['phone', 'verification_code', 'is_verified', 'created_at']
    class Meta:
        model = PhoneVerification
        fields = '__all__'

    def __init__(self, *args, request=None, **kwargs):
        super().__init__(*args, **kwargs)
        if request and not request.user.is_superuser:
            for field_name in self.fields:
                if field_name != 'status':
                    self.fields[field_name].widget.attrs['readonly'] = True

class OrderAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'status', 'address']
    form = OrderAdminForm

    def get_readonly_fields(self, request, obj=None):
        if request.user.is_superuser:
            return []
        if obj:
            return [field.name for field in self.model._meta.fields if field.name != 'status']
        return []

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        elif request.user.is_authenticated:
            try:
                master = request.user.master
                return qs.filter(master=master)
            except Master.DoesNotExist:
                return qs.none()
        else:
            return qs.none()

    def has_change_permission(self, request, obj=None):
        if obj:
            if request.user.is_superuser:
                return True
            try:
                master = request.user.master
                return obj.master == master
            except Master.DoesNotExist:
                return False
        return False

admin.site.register(Master, MasterAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(PhoneVerification, PhoneVerificationAdmin)