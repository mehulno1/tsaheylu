import { api } from './client';

export async function requestOtp(phone: string) {
  return api.post('/auth/request-otp', { phone });
}

export async function verifyOtp(phone: string, otp: string) {
  return api.post('/auth/verify-otp', { phone, otp });
}
