from fastapi import APIRouter, HTTPException
from app.schemas.auth import OTPRequest
from app.services.otp_service import generate_otp
from app.schemas.auth import OTPVerifyRequest
from app.services.otp_service import verify_otp
from app.db.user_repo import get_user_by_phone, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


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

    if not verify_otp(phone, otp):
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
