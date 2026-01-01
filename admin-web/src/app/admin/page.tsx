'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/apiConfig';

type Club = {
  club_id: number;
  club_name: string;
};

export default function AdminHomePage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyClubs() {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/admin/my-clubs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) {
          alert('You do not have admin access to any clubs.');
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch clubs');
        }

        const data = await res.json();
        setClubs(data);
        
        // Store authorized club IDs for route protection
        const clubIds = data.map((c: Club) => c.club_id);
        localStorage.setItem('admin_club_ids', JSON.stringify(clubIds));
        
        // Store club data (including names) for easy access
        localStorage.setItem('admin_clubs_data', JSON.stringify(data));
      } catch (err) {
        console.error(err);
        alert('Failed to load clubs');
      } finally {
        setLoading(false);
      }
    }

    fetchMyClubs();
  }, [router]);

  if (loading) {
    return (
      <div>
        <p>Loading your clubs...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        Admin Dashboard
      </h1>

      <p style={{ marginTop: 8, color: '#555' }}>
        Select a club to manage members, events, announcements and passes.
      </p>

      {clubs.length === 0 ? (
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
          <p>You do not have admin access to any clubs.</p>
        </div>
      ) : (
        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {clubs.map((club) => (
            <div
              key={club.club_id}
              style={{
                padding: 16,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e5e5e5',
              }}
            >
              <strong>{club.club_name}</strong>
              <div style={{ marginTop: 12 }}>
                <Link href={`/admin/clubs/${club.club_id}`}>
                  → Manage Club
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
