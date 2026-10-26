import re
from datetime import date

from rest_framework import serializers

from .availability import free_slots
from .models import Booking, Review, Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "category", "name", "description", "price", "duration_minutes"]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "rating", "text"]


class BookingSerializer(serializers.ModelSerializer):
    pay_now = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Booking
        fields = ["id", "service", "customer_name", "phone", "email", "date", "start_time",
                  "notes", "status", "payment_status", "deposit_amount", "pay_now"]
        read_only_fields = ["id", "status", "payment_status", "deposit_amount"]

    def create(self, validated_data):
        validated_data.pop("pay_now", None)
        return super().create(validated_data)

    def validate_phone(self, v):
        v = re.sub(r"[\s\-+]", "", v)
        if v.startswith("0"):
            v = "254" + v[1:]
        if not re.fullmatch(r"254[17]\d{8}", v):
            raise serializers.ValidationError("Enter a valid Kenyan number, e.g. 0712 345 678.")
        return v

    def validate_date(self, v):
        if v < date.today():
            raise serializers.ValidationError("Pick a date from today onwards.")
        return v

    def validate(self, data):
        service = data["service"]
        if not service.is_active:
            raise serializers.ValidationError("That service is not available.")
        slot = data["start_time"].strftime("%H:%M")
        if slot not in free_slots(data["date"], service.duration_minutes):
            raise serializers.ValidationError({"start_time": "That time was just taken. Please pick another."})
        return data
