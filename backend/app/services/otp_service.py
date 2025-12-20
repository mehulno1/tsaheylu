import random
import time

# In-memory store (SAFE for now)
_otp_store = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes


def generate_otp(phone: str) -> str:
    otp = str(random.randint(100000, 999999))
    _otp_store[phone] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
    }
    print(f"[OTP DEBUG] Phone: {phone}, OTP: {otp}")
    return otp


def verify_otp(phone: str, otp: str) -> bool:
    record = _otp_store.get(phone)
    if not record:
        return False

    if time.time() > record["expires_at"]:
        del _otp_store[phone]
        return False

    if record["otp"] != otp:
        return False

    del _otp_store[phone]
    return True
