'use client';

import { useEffect, useState } from 'react';
import {
  fetchPendingMembers,
  approveMember,
  PendingMember,
  rejectMember,
} from '@/lib/api/adminMembers';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  

  async function loadMembers() {
    try {
      const data = await fetchPendingMembers();
      setMembers(data);
    } catch (err) {
      alert('Failed to load pending members');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    await approveMember(id);
    await loadMembers();
  }

  async function handleReject(id: number) {
    if (!reason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
  
    await rejectMember(id, reason);
    setRejectingId(null);
    setReason('');
    await loadMembers();
  }
  

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Pending Membership Requests
      </h1>

      {loading && <p>Loading...</p>}

      {!loading && members.length === 0 && (
        <p className="text-gray-500">
          No pending requests.
        </p>
      )}

{members.map((m) => (
  <div
    key={m.membership_id}
    className="border p-4 rounded mb-4"
  >
    <p className="font-medium">
      Phone: {m.phone}
    </p>

    {m.dependent_name && (
      <p className="text-sm text-gray-600">
        Dependent: {m.dependent_name} ({m.relation})
      </p>
    )}

    {/* Action buttons */}
    <div className="mt-3 flex gap-3">
      <button
        onClick={() => handleApprove(m.membership_id)}
        className="bg-green-600 text-white px-4 py-1 rounded"
      >
        Approve
      </button>

      <button
        onClick={() => setRejectingId(m.membership_id)}
        className="bg-red-600 text-white px-4 py-1 rounded"
      >
        Reject
      </button>
    </div>

    {/* Reject reason input */}
    {rejectingId === m.membership_id && (
      <div className="mt-3">
        <textarea
          placeholder="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border p-2 rounded mb-2"
          rows={2}
        />

        <button
          onClick={() => handleReject(m.membership_id)}
          className="bg-black text-white px-3 py-1 rounded"
        >
          Confirm Reject
        </button>
      </div>
    )}
  </div>
))}

    </div>
  );
}
