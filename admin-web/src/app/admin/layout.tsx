'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    
    // Allow access to login page
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    // For all other admin routes, require authentication
    if (!token) {
      router.push('/admin/login');
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);
  }, [router, pathname]);

  // Don't render anything until we've checked authentication
  if (isAuthenticated === null) {
    return null;
  }

  // Don't render admin UI if not authenticated (login page handles its own UI)
  if (!isAuthenticated) {
    return null;
  }

  // Login page doesn't need the admin header
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  function handleLogout() {
    // Clear authentication token
    localStorage.removeItem('admin_token');
    // Clear admin-specific cached state
    localStorage.removeItem('admin_club_ids');
    // Redirect to login
    router.push('/admin/login');
  }

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Tsaheylu — Admin Panel</span>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #fff',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Logout
        </button>
      </header>

      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
