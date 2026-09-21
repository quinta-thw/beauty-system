from datetime import date

from django.conf import settings
from django.db import transaction
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import mpesa
from .availability import free_slots
from .models import Booking, Review, Service
from .serializers import BookingSerializer, ReviewSerializer, ServiceSerializer

DEPOSIT_RATE = 0.2


class ServiceList(generics.ListAPIView):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    pagination_class = None


class ReviewList(generics.ListAPIView):
    queryset = Review.objects.filter(is_published=True)
    serializer_class = ReviewSerializer
    pagination_class = None


@api_view(["GET"])
def site_info(request):
    return Response({
        "whatsapp": settings.SALON_WHATSAPP,
        "open_hour": settings.SALON_OPEN_HOUR,
        "close_hour": settings.SALON_CLOSE_HOUR,
        "stats": {
            "reviews": Review.objects.filter(is_published=True).count(),
            "clients": Booking.objects.values("phone").distinct().count(),
        },
    })


@api_view(["GET"])
def availability(request):
    try:
        day = date.fromisoformat(request.query_params["date"])
        service = Service.objects.get(pk=request.query_params["service"], is_active=True)
    except (KeyError, ValueError, Service.DoesNotExist):
        return Response({"detail": "date (YYYY-MM-DD) and a valid service are required."}, status=400)
    if day < date.today():
        return Response({"slots": []})
    return Response({"slots": free_slots(day, service.duration_minutes)})


@api_view(["POST"])
def create_booking(request):
    # Validation and save share one transaction so two people cannot take the same slot.
    with transaction.atomic():
        ser = BookingSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        pay_now = ser.validated_data.get("pay_now")
        booking = ser.save()
        if pay_now:
            booking.deposit_amount = int(booking.service.price * DEPOSIT_RATE)
            try:
                checkout_id, demo = mpesa.stk_push(booking.phone, booking.deposit_amount, f"PG{booking.id}")
                booking.mpesa_checkout_id = checkout_id
                booking.payment_status = Booking.Payment.PAID if demo else Booking.Payment.PENDING
                if demo:
                    booking.mpesa_receipt = "DEMO"
            except Exception:
                booking.payment_status = Booking.Payment.FAILED
            booking.save()
    return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def mpesa_callback(request):
    """Daraja posts the payment result here."""
    try:
        cb = request.data["Body"]["stkCallback"]
        booking = Booking.objects.get(mpesa_checkout_id=cb["CheckoutRequestID"])
    except (KeyError, Booking.DoesNotExist):
        return Response({"ResultCode": 0, "ResultDesc": "Ignored"})
    if cb["ResultCode"] == 0:
        items = {i["Name"]: i.get("Value") for i in cb.get("CallbackMetadata", {}).get("Item", [])}
        booking.payment_status = Booking.Payment.PAID
        booking.mpesa_receipt = str(items.get("MpesaReceiptNumber", ""))
    else:
        booking.payment_status = Booking.Payment.FAILED
    booking.save()
    return Response({"ResultCode": 0, "ResultDesc": "Accepted"})
