'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClubDashboardPage() {
  const params = useParams();
  const clubId = params.clubId as string;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        Club Dashboard
      </h1>

      <p style={{ marginTop: 6, color: '#555' }}>
        Managing Club ID: {clubId}
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
