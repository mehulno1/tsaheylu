'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Top bar */}
      <header
        style={{
          background: '#000',
          color: '#fff',
          padding: '14px 24px',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        Tsaheylu — Admin Panel
      </header>

      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
