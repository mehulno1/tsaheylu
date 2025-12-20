from pydantic import BaseModel, Field


class OTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)

class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6)