'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchAllClubMembers } from '@/lib/api/adminMembers';

type Member = {
  membership_id: number;
  phone: string;
  member_type: 'self' | 'dependent';
  name: string | null;
  relation: string | null;
  status: string;
  rejection_reason: string | null;
};

export default function ClubMembersPage() {
  const params = useParams();
  const clubId = Number(params.clubId);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await fetchAllClubMembers(clubId);
        setMembers(data);
      } catch (err) {
        console.error(err);
        alert('Failed to load members');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [clubId]);

  if (loading) return <div>Loading members...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Club Members</h2>

      <table style={{ marginTop: 20, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Phone</th>
            <th align="left">Member</th>
            <th align="left">Type</th>
            <th align="left">Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.membership_id}>
              <td>{m.phone}</td>
              <td>
                {m.member_type === 'self'
                  ? 'Self'
                  : `${m.name} (${m.relation})`}
              </td>
              <td>{m.member_type}</td>
              <td>{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
