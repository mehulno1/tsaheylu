'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = 'http://127.0.0.1:8000';

export default function ClubDashboardPage() {
  const params = useParams();
  const clubId = params.clubId as string;
  const [clubName, setClubName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClubName() {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      // Try to get from localStorage first
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

    fetchClubName();
  }, [clubId]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        Club Dashboard
      </h1>

      <p style={{ marginTop: 6, color: '#555' }}>
        {clubName ? `Managing Club: ${clubName}` : `Managing Club ID: ${clubId}`}
      </p>

      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <Link href={`/admin/clubs/${clubId}/members`}>
          <Card title="Members" />
        </Link>
        <Card title="Announcements" />
        <Card title="Events" />
        <Card title="Passes" />
      </div>
    </div>
  );
}

function Card({ title }: { title: string }) {
  return (
    <div
      style={{
        background: '#fff',
        padding: 16,
        borderRadius: 10,
        border: '1px solid #e5e5e5',
      }}
    >
      <strong>{title}</strong>
      <p style={{ marginTop: 6, color: '#666' }}>
        Manage {title.toLowerCase()}
      </p>
    </div>
  );
}
