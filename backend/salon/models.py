from django.db import models


class Service(models.Model):
    category = models.CharField(max_length=60)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    price = models.PositiveIntegerField(help_text="Price in KES")
    duration_minutes = models.PositiveIntegerField(default=60)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "category", "name"]

    def __str__(self):
        return f"{self.name} (KES {self.price})"


class Review(models.Model):
    name = models.CharField(max_length=80)
    rating = models.PositiveSmallIntegerField(default=5)
    text = models.TextField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.rating}*"


class GalleryImage(models.Model):
    image = models.ImageField(upload_to="gallery/")
    caption = models.CharField(max_length=120, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "-id"]


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    class Payment(models.TextChoices):
        UNPAID = "unpaid", "Pay at salon"
        PENDING = "pending", "M-Pesa prompt sent"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="bookings")
    customer_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, help_text="Format 2547XXXXXXXX")
    email = models.EmailField(blank=True)
    date = models.DateField()
    start_time = models.TimeField()
    notes = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.CONFIRMED)
    payment_status = models.CharField(max_length=10, choices=Payment.choices, default=Payment.UNPAID)
    deposit_amount = models.PositiveIntegerField(default=0)
    mpesa_checkout_id = models.CharField(max_length=100, blank=True)
    mpesa_receipt = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.customer_name} - {self.service.name} on {self.date} {self.start_time:%H:%M}"
