from datetime import date, datetime, timedelta

from django.conf import settings
from django.utils import timezone

from .models import Booking


def _steps(start: datetime, minutes: int):
    step = timedelta(minutes=settings.SALON_SLOT_MINUTES)
    t, end = start, start + timedelta(minutes=minutes)
    while t < end:
        yield t
        t += step


def free_slots(day: date, duration: int):
    """Return a list of 'HH:MM' start times where a client with this duration fits."""
    step = settings.SALON_SLOT_MINUTES
    open_dt = datetime.combine(day, datetime.min.time()).replace(hour=settings.SALON_OPEN_HOUR)
    close_dt = open_dt.replace(hour=settings.SALON_CLOSE_HOUR)

    load = {}
    booked = Booking.objects.filter(date=day).exclude(status=Booking.Status.CANCELLED).select_related("service")
    for b in booked:
        start = datetime.combine(day, b.start_time)
        for t in _steps(start, b.service.duration_minutes):
            load[t] = load.get(t, 0) + 1

    now = timezone.localtime().replace(tzinfo=None)
    out, cur = [], open_dt
    while cur + timedelta(minutes=duration) <= close_dt:
        fits = all(load.get(t, 0) < settings.SALON_STATIONS for t in _steps(cur, duration))
        if fits and cur > now:
            out.append(cur.strftime("%H:%M"))
        cur += timedelta(minutes=step)
    return out
