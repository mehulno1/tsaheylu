import { api } from './client';

export type ClubEvent = {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  requires_pass: boolean;
};

export async function getClubEvents(clubId: number): Promise<ClubEvent[]> {
  return api.get(`/clubs/${clubId}/events`);
}
