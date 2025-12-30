const API_BASE = 'http://127.0.0.1:8000';

export type PendingMember = {
  membership_id: number;
  phone: string;
  dependent_name: string | null;
  relation: string | null;
};

export type ClubMember = {
  membership_id: number;
  phone: string;
  member_type: 'self' | 'dependent';
  name: string | null;
  relation: string | null;
  status: string;
  rejection_reason: string | null;
};

// PENDING MEMBERS

export async function fetchPendingMembers(clubId: number): Promise<PendingMember[]> {
  const token = localStorage.getItem('admin_token');

  const res = await fetch(
    `${API_BASE}/admin/clubs/${clubId}/pending-members`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch pending members');
  }

  return res.json();
}

export async function approveMember(membershipId: number) {
  const token = localStorage.getItem('admin_token');

  const res = await fetch(
    `${API_BASE}/admin/memberships/${membershipId}/approve`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to approve member');
  }
}

export async function rejectMember(
  membershipId: number,
  reason: string
) {
  const token = localStorage.getItem('admin_token');

  const res = await fetch(
    `${API_BASE}/admin/memberships/${membershipId}/reject`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to reject member');
  }
}

// ALL MEMBERS

export async function fetchAllClubMembers(
  clubId: number
): Promise<ClubMember[]> {
  const token = localStorage.getItem('admin_token');

  const res = await fetch(
    `${API_BASE}/admin/clubs/${clubId}/members`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch members');
  }

  return res.json();
}
