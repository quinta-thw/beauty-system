from django.core.management.base import BaseCommand

from salon.models import Review, Service

SERVICES = [
    ("Hair", "Silk press", "Wash, deep condition and a smooth blow-out finish", 3500, 90),
    ("Hair", "Box braids", "Medium length, neat parts, edges laid", 4500, 240),
    ("Hair", "Cut and style", "Consultation, cut and a finish that suits you", 1800, 60),
    ("Hair", "Colour and tone", "Full colour with a bond-repair treatment", 6500, 150),
    ("Nails", "Gel manicure", "Shape, cuticle care and long-wear gel colour", 1500, 45),
    ("Nails", "Acrylic full set", "Custom length and shape with your design", 3000, 120),
    ("Nails", "Spa pedicure", "Soak, scrub, massage and polish", 2000, 60),
    ("Skin", "Signature facial", "Deep cleanse, exfoliation, mask and massage", 3800, 60),
    ("Skin", "Brow shaping and tint", "Mapped, waxed and tinted", 1200, 30),
    ("Lashes", "Classic lash extensions", "One extension per natural lash", 4000, 120),
    ("Makeup", "Bridal or event makeup", "Trial notes and long-wear finish", 5500, 90),
]
REVIEWS = [
    ("Wanjiru K.", 5, "My silk press lasted three weeks and the salon smells amazing. Booked my next visit before leaving."),
    ("Amina H.", 5, "Finally a place that starts on time. My gel nails are still perfect a month later."),
    ("Faith M.", 5, "The facial was the best hour of my week. Everyone was kind and unhurried."),
    ("Njeri T.", 4, "Lovely lashes and a calm space. Parking is tight but it was worth it."),
]


class Command(BaseCommand):
    help = "Load demo services and reviews"

    def handle(self, *args, **options):
        if not Service.objects.exists():
            for i, (cat, name, desc, price, mins) in enumerate(SERVICES):
                Service.objects.create(category=cat, name=name, description=desc,
                                       price=price, duration_minutes=mins, order=i)
        if not Review.objects.exists():
            for name, rating, text in REVIEWS:
                Review.objects.create(name=name, rating=rating, text=text)
        self.stdout.write("Seeded.")
