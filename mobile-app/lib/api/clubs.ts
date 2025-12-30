import { api } from './client';
import type { MembershipStatus } from '../membership';

export type ClubMember =
  | { type: 'self' }
  | { type: 'dependent'; name: string; relation: string };

export type ClubResponse = {
  club_id: number;
  club_name: string;
  status: MembershipStatus;
  rejection_reason: string | null;
  expiry_date: string | null;
  members: ClubMember[];
};

export type AllClub = {
  club_id: number;
  club_name: string;
};

export async function fetchMyClubs(): Promise<ClubResponse[]> {
  return api.get('/me/clubs');
}

export async function fetchAllClubs(): Promise<AllClub[]> {
  return api.get('/me/clubs/all');
}

export async function requestMembership(
  clubId: number,
  dependentId?: number | null
): Promise<{ success: boolean; membership_id: number }> {
  return api.post(`/me/clubs/${clubId}/request-membership`, {
    dependent_id: dependentId ?? null,
  });
}

export async function requestMembershipsBatch(
  clubId: number,
  dependentIds: (number | null)[]
): Promise<{ success: boolean; created: number[]; skipped: Array<{ dependent_id: number | null; membership_id: number; status: string }> }> {
  return api.post(`/me/clubs/${clubId}/request-membership`, {
    dependent_ids: dependentIds,
  });
}
