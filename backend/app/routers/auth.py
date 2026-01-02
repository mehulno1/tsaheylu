import os
from fastapi import APIRouter, HTTPException
from app.schemas.auth import OTPRequest
from app.services.otp_service import generate_otp
from app.schemas.auth import OTPVerifyRequest
from app.services.otp_service import verify_otp
from app.db.user_repo import get_user_by_phone, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_test_otp_mode() -> bool:
    """TEMPORARY: Beta test OTP bypass - remove after beta period"""
    return os.getenv("TEST_OTP_MODE", "false").lower() == "true"


def _get_test_otp_code() -> str:
    """TEMPORARY: Beta test OTP bypass - remove after beta period"""
    return os.getenv("TEST_OTP_CODE", "123456")


@router.post("/request-otp")
def request_otp(payload: OTPRequest):
    phone = payload.phone.strip()

    if not phone.isdigit():
        raise HTTPException(status_code=400, detail="Invalid phone number")

    generate_otp(phone)

    return {
        "message": "OTP sent successfully"
    }

@router.post("/verify-otp")
def verify_otp_and_login(payload: OTPVerifyRequest):
    phone = payload.phone.strip()
    otp = payload.otp.strip()

    # TEMPORARY: Beta test OTP bypass - allows login with fixed test OTP when enabled
    # This bypass is isolated to OTP verification only and must be removed after beta period
    otp_valid = False
    test_otp_mode = _get_test_otp_mode()
    test_otp_code = _get_test_otp_code()
    if test_otp_mode and otp == test_otp_code:
        otp_valid = True
    else:
        # Normal OTP verification flow
        otp_valid = verify_otp(phone, otp)

    if not otp_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = get_user_by_phone(phone)

    if user:
        user_id = user.id
    else:
        user_id = create_user(phone)

    # TEMP auth token (we’ll replace with JWT later)
    token = f"user-{user_id}"

    return {
        "token": token,
        "user_id": user_id
    }
