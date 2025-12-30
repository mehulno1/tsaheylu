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

export async function fetchMyClubs(): Promise<ClubResponse[]> {
  return api.get('/me/clubs');
}
