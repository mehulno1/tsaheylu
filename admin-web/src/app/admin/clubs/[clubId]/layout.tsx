'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const clubId = params.clubId as string;

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
