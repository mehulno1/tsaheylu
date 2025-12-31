'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API_BASE = 'http://127.0.0.1:8000';

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      // Check if club is in authorized list
      const storedClubIds = localStorage.getItem('admin_club_ids');
      if (storedClubIds) {
        const clubIds: number[] = JSON.parse(storedClubIds);
        if (clubIds.includes(Number(clubId))) {
          setAuthorized(true);
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
        <h3 style={{ marginBottom: 16 }}>Club Admin</h3>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={`/admin/clubs/${clubId}`}>Overview</Link>
          <Link href={`/admin/clubs/${clubId}/members`}>Members</Link>
          <Link href={`/admin/clubs/${clubId}/pending-members`}>Pending Members</Link>
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
