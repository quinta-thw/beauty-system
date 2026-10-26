from django.contrib import admin
from .models import Booking, GalleryImage, Review, Service

admin.site.site_header = "Petals & Glam"


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "duration_minutes", "is_active", "order")
    list_editable = ("price", "is_active", "order")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "phone", "service", "date", "start_time", "status", "payment_status")
    list_filter = ("status", "payment_status", "date")
    search_fields = ("customer_name", "phone", "mpesa_receipt")


admin.site.register(Review)
admin.site.register(GalleryImage)
