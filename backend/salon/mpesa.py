import base64
from datetime import datetime

import requests
from django.conf import settings

BASES = {"sandbox": "https://sandbox.safaricom.co.ke", "production": "https://api.safaricom.co.ke"}


def configured():
    m = settings.MPESA
    return all(m[k] for k in ("CONSUMER_KEY", "CONSUMER_SECRET", "PASSKEY", "CALLBACK_URL"))


def stk_push(phone: str, amount: int, reference: str):
    """Send an STK push. Returns (checkout_request_id, demo_flag)."""
    if not configured():
        return f"demo-{reference}", True

    m = settings.MPESA
    base = BASES.get(m["ENV"], BASES["sandbox"])
    token = requests.get(
        f"{base}/oauth/v1/generate?grant_type=client_credentials",
        auth=(m["CONSUMER_KEY"], m["CONSUMER_SECRET"]), timeout=15,
    ).json()["access_token"]
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{m['SHORTCODE']}{m['PASSKEY']}{ts}".encode()).decode()
    res = requests.post(
        f"{base}/mpesa/stkpush/v1/processrequest",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "BusinessShortCode": m["SHORTCODE"], "Password": password, "Timestamp": ts,
            "TransactionType": "CustomerPayBillOnline", "Amount": amount,
            "PartyA": phone, "PartyB": m["SHORTCODE"], "PhoneNumber": phone,
            "CallBackURL": m["CALLBACK_URL"], "AccountReference": reference,
            "TransactionDesc": "Petals and Glam deposit",
        }, timeout=20,
    ).json()
    return res["CheckoutRequestID"], False
