/**
 * Canonical membership status definitions and UI behavior mapping
 */

export type MembershipStatus = 'active' | 'pending' | 'rejected' | 'expired';

export interface MembershipStatusConfig {
  label: string;
  color: string;
  allowsActions: boolean;
  explanation: string;
  actionDisabledMessage: string;
}

/**
 * Canonical mapping of membership status → UI behavior
 */
export const MEMBERSHIP_STATUS_CONFIG: Record<MembershipStatus, MembershipStatusConfig> = {
  active: {
    label: 'Membership Active',
    color: '#22c55e', // green
    allowsActions: true,
    explanation: 'Your membership is active. You can access all club features.',
    actionDisabledMessage: '',
  },
  pending: {
    label: 'Pending Approval',
    color: '#d97706', // orange/amber
    allowsActions: false,
    explanation: 'Your membership request is pending approval from the club administrator.',
    actionDisabledMessage: 'Membership is pending approval. Please wait for administrator approval.',
  },
  rejected: {
    label: 'Membership Rejected',
    color: '#dc2626', // red
    allowsActions: false,
    explanation: 'Your membership request has been rejected.',
    actionDisabledMessage: 'Membership has been rejected. Please contact the club administrator.',
  },
  expired: {
    label: 'Membership Expired',
    color: '#dc2626', // red
    allowsActions: false,
    explanation: 'Your membership has expired. Please renew your membership to continue access.',
    actionDisabledMessage: 'Membership has expired. Please renew your membership.',
  },
};

/**
 * Get membership status configuration
 */
export function getMembershipStatusConfig(status: MembershipStatus): MembershipStatusConfig {
  return MEMBERSHIP_STATUS_CONFIG[status];
}

/**
 * Check if membership allows actions
 */
export function membershipAllowsActions(status: MembershipStatus): boolean {
  return MEMBERSHIP_STATUS_CONFIG[status].allowsActions;
}

/**
 * Get formatted rejection reason message
 * Always returns a message when status is rejected, even if reason is null
 */
export function getRejectionReasonMessage(
  status: MembershipStatus,
  rejectionReason: string | null | undefined
): string | null {
  if (status !== 'rejected') {
    return null;
  }

  if (rejectionReason && rejectionReason.trim()) {
    return rejectionReason.trim();
  }

  // Always show a message for rejected status, even if reason is not provided
  return 'No specific reason provided. Please contact the club administrator for more information.';
}

/**
 * Get membership explanation text
 */
export function getMembershipExplanation(status: MembershipStatus): string {
  return MEMBERSHIP_STATUS_CONFIG[status].explanation;
}

/**
 * Get action disabled message
 */
export function getActionDisabledMessage(status: MembershipStatus): string {
  return MEMBERSHIP_STATUS_CONFIG[status].actionDisabledMessage;
}

