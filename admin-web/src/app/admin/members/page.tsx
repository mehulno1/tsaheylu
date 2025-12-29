'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Member = {
  membership_id: number;
  name: string;
  phone: string;
  dependent_name: string | null;
  dependent_relation: string | null;
};

export default function MembersPage() {
  const params = useParams();
  const clubId = params.clubId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPendingMembers();
  }, []);

  async function loadPendingMembers() {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(
        `http://127.0.0.1:8000/admin/clubs/${clubId}/pending-members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoading(false);
    }
  }

  async function approveMember(id: number) {
    const token = localStorage.getItem('admin_token');
    await fetch(
      `http://127.0.0.1:8000/admin/memberships/${id}/approve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    loadPendingMembers();
  }

  async function rejectMember(id: number) {
    if (!rejectReason) {
      alert('Please enter rejection reason');
      return;
    }

    const token = localStorage.getItem('admin_token');
    await fetch(
      `http://127.0.0.1:8000/admin/memberships/${id}/reject`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      }
    );

    setRejectReason('');
    loadPendingMembers();
  }

  if (loading) {
    return <p>Loading members...</p>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        Pending Members
      </h2>

      {members.length === 0 && (
        <p style={{ marginTop: 12, color: '#666' }}>
          No pending members 🎉
        </p>
      )}

      {members.map((m) => (
        <div
          key={m.membership_id}
          style={{
            marginTop: 16,
            padding: 16,
            background: '#fff',
            borderRadius: 10,
            border: '1px solid #e5e5e5',
          }}
        >
          <strong>{m.name}</strong>
          <p style={{ marginTop: 4 }}>
            Phone: {m.phone}
          </p>

          {m.dependent_name && (
            <p style={{ marginTop: 4, color: '#555' }}>
              Dependent: {m.dependent_name} ({m.dependent_relation})
            </p>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button
              onClick={() => approveMember(m.membership_id)}
              style={btnApprove}
            >
              Approve
            </button>

            <input
              placeholder="Rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={() => rejectMember(m.membership_id)}
              style={btnReject}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Styles */
const btnApprove = {
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 6,
  cursor: 'pointer',
};

const btnReject = {
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 6,
  cursor: 'pointer',
};

const inputStyle = {
  padding: '8px',
  borderRadius: 6,
  border: '1px solid #ccc',
};
