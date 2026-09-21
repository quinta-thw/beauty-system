# Petals & Glam

Django REST backend + Expo (React Native, runs on web, iOS and Android) frontend.

## Run it

Backend (http://localhost:8000):

    cd backend
    .venv\Scripts\python manage.py runserver

Frontend (press `w` for the web version):

    cd frontend
    npm start

Point a phone or deployed site at the API with `EXPO_PUBLIC_API_URL=https://your-host/api`.

## Make it yours

- Salon name, address, hours, social handles: `frontend/src/theme.js`
- Services, prices, reviews, bookings: Django admin at /admin (`manage.py createsuperuser` first)
- Opening hours, slot length, chairs at once, WhatsApp number: `backend/config/settings.py`
- Gallery: replace the colour tiles in `frontend/App.js` (Gallery) with `<Image>` photos

## M-Pesa

Without keys the deposit runs in demo mode (marked paid as DEMO). To go live set
MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY and
MPESA_CALLBACK_URL (public https URL ending in /api/mpesa/callback/).
