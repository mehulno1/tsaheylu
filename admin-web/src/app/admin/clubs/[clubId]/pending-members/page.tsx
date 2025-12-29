'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchPendingMembers,
  approveMember,
  rejectMember,
  PendingMember,
} from '@/lib/api/adminMembers';

export default function PendingMembersPage() {
  const params = useParams();
  const clubId = Number(params.clubId);

  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMembers() {
    try {
      setLoading(true);
      const data = await fetchPendingMembers(clubId);
      setMembers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [clubId]);

  async function handleApprove(id: number) {
    await approveMember(id);
    loadMembers();
  }

  async function handleReject(id: number) {
    const reason = prompt('Rejection reason?');
    if (!reason) return;

    await rejectMember(id, reason);
    loadMembers();
  }

  if (loading) return <p>Loading pending members...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Pending Members</h2>

      {members.length === 0 && <p>No pending members.</p>}

      <table style={{ marginTop: 20, width: '100%' }}>
        <thead>
          <tr>
            <th align="left">Phone</th>
            <th align="left">Member</th>
            <th align="left">Relation</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.membership_id}>
              <td>{m.phone}</td>
              <td>{m.dependent_name ?? 'Self'}</td>
              <td>{m.relation ?? '-'}</td>
              <td>
                <button onClick={() => handleApprove(m.membership_id)}>
                  Approve
                </button>
                &nbsp;
                <button onClick={() => handleReject(m.membership_id)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
