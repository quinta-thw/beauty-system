from django.urls import path

from . import views

urlpatterns = [
    path("info/", views.site_info),
    path("services/", views.ServiceList.as_view()),
    path("reviews/", views.ReviewList.as_view()),
    path("availability/", views.availability),
    path("bookings/", views.create_booking),
    path("mpesa/callback/", views.mpesa_callback),
]
