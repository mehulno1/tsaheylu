'use client';

import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        Admin Dashboard
      </h1>

      <p style={{ marginTop: 8, color: '#555' }}>
        Select a club to manage members, events, announcements and passes.
      </p>

      {/* Temporary club shortcut */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: '#fff',
          borderRadius: 10,
          border: '1px solid #e5e5e5',
          maxWidth: 400,
        }}
      >
        <strong>Shri Jain Shwetambar Sangh</strong>

        <div style={{ marginTop: 12 }}>
          <Link href="/admin/clubs/1">
            → Manage Club
          </Link>
        </div>
      </div>
    </div>
  );
}
