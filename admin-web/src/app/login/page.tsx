'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/apiConfig';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setStep('otp');
    } catch {
      alert('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      localStorage.setItem('admin_token', data.token);

      router.push('/admin');
    } catch {
      alert('OTP verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow">
        <h1 className="text-xl font-semibold mb-4 text-center">
          Admin Login
        </h1>

        {step === 'phone' && (
          <>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ''))
              }
              maxLength={10}
              className="w-full border p-2 rounded mb-4"
            />

            <button
              onClick={requestOtp}
              disabled={phone.length !== 10 || loading}
              className="w-full bg-black text-white py-2 rounded disabled:bg-gray-400"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full border p-2 rounded mb-4"
            />

            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || loading}
              className="w-full bg-black text-white py-2 rounded disabled:bg-gray-400"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
