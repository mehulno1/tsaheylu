import { api } from './client';

export type ClubResponse = {
  club_id: number;
  club_name: string;
  role: string;
  status: string;
  expiry_date: string | null;
};

export async function fetchMyClubs(): Promise<ClubResponse[]> {
  return api.get('/me/clubs');
}
