import { api } from './client';

export async function getClubAnnouncements(clubId: number) {
  return api.get(`/clubs/${clubId}/announcements`);
}
