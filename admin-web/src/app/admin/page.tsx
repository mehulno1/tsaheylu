'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">
        Club Admin Dashboard
      </h1>

      <p className="mt-2 text-gray-600">
        (Admin access verified — role checks coming next)
      </p>
    </div>
  );
}
