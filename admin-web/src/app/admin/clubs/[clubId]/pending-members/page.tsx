'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchPendingMembers,
  approveMember,
  rejectMember,
  PendingMember,
} from '@/lib/api/adminMembers';

type ActionType = 'approve' | 'reject' | null;
type ActionState = {
  type: ActionType;
  membershipId: number | null;
  memberName: string;
};

export default function PendingMembersPage() {
  const params = useParams();
  const clubId = Number(params.clubId);

  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action state management
  const [actionState, setActionState] = useState<ActionState>({
    type: null,
    membershipId: null,
    memberName: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadMembers() {
    try {
      setLoading(true);
      setError(null);
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

  function openApproveConfirmation(membershipId: number, memberName: string) {
    setActionState({
      type: 'approve',
      membershipId,
      memberName,
    });
    setActionError(null);
  }

  function openRejectDialog(membershipId: number, memberName: string) {
    setActionState({
      type: 'reject',
      membershipId,
      memberName,
    });
    setRejectionReason('');
    setActionError(null);
  }

  function closeActionDialog() {
    setActionState({ type: null, membershipId: null, memberName: '' });
    setRejectionReason('');
    setActionError(null);
  }

  async function confirmApprove() {
    if (!actionState.membershipId || processing) return;

    try {
      setProcessing(true);
      setActionError(null);
      await approveMember(actionState.membershipId);
      
      // Update UI immediately to reflect backend state
      setMembers((prev) =>
        prev.filter((m) => m.membership_id !== actionState.membershipId)
      );
      
      closeActionDialog();
      
      // Reload to ensure UI matches backend
      await loadMembers();
    } catch (err) {
      console.error('Failed to approve member:', err);
      setActionError('Failed to approve member. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function confirmReject() {
    if (!actionState.membershipId || !rejectionReason.trim() || processing) {
      if (!rejectionReason.trim()) {
        setActionError('Please enter a rejection reason');
      }
      return;
    }

    try {
      setProcessing(true);
      setActionError(null);
      await rejectMember(actionState.membershipId, rejectionReason.trim());
      
      // Update UI immediately to reflect backend state
      setMembers((prev) =>
        prev.filter((m) => m.membership_id !== actionState.membershipId)
      );
      
      closeActionDialog();
      
      // Reload to ensure UI matches backend
      await loadMembers();
    } catch (err) {
      console.error('Failed to reject member:', err);
      setActionError('Failed to reject member. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function getMemberDisplayName(member: PendingMember): string {
    if (member.dependent_name) {
      return `${member.dependent_name} (${member.relation || 'dependent'})`;
    }
    return 'Self';
  }

  function isProcessingMembership(membershipId: number): boolean {
    return processing && actionState.membershipId === membershipId;
  }

  if (loading) return <p>Loading pending members...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Pending Members</h2>

      {members.length === 0 && <p>No pending members.</p>}

      <table style={{ marginTop: 20, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left" style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
              Phone
            </th>
            <th align="left" style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
              Member
            </th>
            <th align="left" style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
              Relation
            </th>
            <th align="left" style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const isProcessing = isProcessingMembership(m.membership_id);
            const memberName = getMemberDisplayName(m);
            
            return (
              <tr key={m.membership_id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {m.phone}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {memberName}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {m.relation ?? '-'}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <button
                    onClick={() => openApproveConfirmation(m.membership_id, memberName)}
                    disabled={processing || isProcessing}
                    style={{
                      padding: '6px 12px',
                      marginRight: '8px',
                      backgroundColor: processing || isProcessing ? '#ccc' : '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processing || isProcessing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => openRejectDialog(m.membership_id, memberName)}
                    disabled={processing || isProcessing}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: processing || isProcessing ? '#ccc' : '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: processing || isProcessing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Approve Confirmation Modal */}
      {actionState.type === 'approve' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeActionDialog}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              Confirm Approval
            </h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Are you sure you want to approve membership for{' '}
              <strong>{actionState.memberName}</strong>?
            </p>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#888' }}>
              This action will activate their membership and grant access to club
              features.
            </p>
            {actionError && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  color: '#dc2626',
                  fontSize: '14px',
                }}
              >
                {actionError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeActionDialog}
                disabled={processing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={processing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: processing ? '#ccc' : '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >
                {processing ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog Modal */}
      {actionState.type === 'reject' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeActionDialog}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              Reject Membership
            </h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Reject membership for <strong>{actionState.memberName}</strong>?
            </p>
            <p style={{ marginBottom: '12px', fontSize: '14px', color: '#888' }}>
              Please provide a reason for rejection. This will be visible to the
              member.
            </p>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setActionError(null);
              }}
              placeholder="Enter reason for rejection..."
              disabled={processing}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '16px',
              }}
            />
            {actionError && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  color: '#dc2626',
                  fontSize: '14px',
                }}
              >
                {actionError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeActionDialog}
                disabled={processing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing || !rejectionReason.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor:
                    processing || !rejectionReason.trim() ? '#ccc' : '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    processing || !rejectionReason.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: '600',
                }}
              >
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
