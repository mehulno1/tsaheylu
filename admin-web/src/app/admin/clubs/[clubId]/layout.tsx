'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/apiConfig';

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      // Fetch club name from my-clubs or use cached data
      async function fetchClubName() {
        // Try to get from localStorage first (stored when admin logs in)
        const storedClubs = localStorage.getItem('admin_clubs_data');
        if (storedClubs) {
          try {
            const clubs: Array<{ club_id: number; club_name: string }> = JSON.parse(storedClubs);
            const club = clubs.find((c) => c.club_id === Number(clubId));
            if (club) {
              setClubName(club.club_name);
              return;
            }
          } catch (err) {
            // If parsing fails, fetch from API
          }
        }

        // Fallback: fetch from API
        try {
          const res = await fetch(`${API_BASE}/admin/my-clubs`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const clubs: Array<{ club_id: number; club_name: string }> = await res.json();
            // Store in localStorage for future use
            localStorage.setItem('admin_clubs_data', JSON.stringify(clubs));
            const club = clubs.find((c) => c.club_id === Number(clubId));
            if (club) {
              setClubName(club.club_name);
            }
          }
        } catch (err) {
          console.error('Failed to fetch club name:', err);
        }
      }

      // Check if club is in authorized list
      const storedClubIds = localStorage.getItem('admin_club_ids');
      if (storedClubIds) {
        const clubIds: number[] = JSON.parse(storedClubIds);
        if (clubIds.includes(Number(clubId))) {
          setAuthorized(true);
          fetchClubName();
          return;
        }
      }

      // If not in stored list, verify with backend
      try {
        const res = await fetch(`${API_BASE}/admin/clubs/${clubId}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) {
          alert('You do not have admin access to this club.');
          router.push('/admin');
          setAuthorized(false);
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to verify access');
        }

        setAuthorized(true);
        fetchClubName();
      } catch (err) {
        console.error(err);
        alert('Failed to verify club access');
        router.push('/admin');
        setAuthorized(false);
      }
    }

    verifyAccess();
  }, [clubId, router]);

  if (authorized === null) {
    return (
      <div style={{ padding: 24 }}>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: '#fff',
          borderRadius: 10,
          border: '1px solid #e5e5e5',
          padding: 16,
        }}
      >
        <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Club Admin</h3>
        {clubName && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 6,
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Active Club</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#000' }}>{clubName}</div>
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={`/admin/clubs/${clubId}`}>Overview</Link>
          <Link href={`/admin/clubs/${clubId}/members`}>Members</Link>
          <Link href={`/admin/clubs/${clubId}/pending-members`}>Pending Members</Link>
          <Link href={`/admin/clubs/${clubId}/bulk-upload`}>Bulk Upload Members</Link>
          <Link href={`/admin/clubs/${clubId}/announcements`}>Announcements</Link>
          <Link href={`/admin/clubs/${clubId}/events`}>Events</Link>
          <Link href={`/admin/clubs/${clubId}/passes`}>Passes</Link>
        </nav>
      </aside>

      {/* Content */}
      <section style={{ flex: 1 }}>{children}</section>
    </div>
  );
}
