import { api } from './client';

export async function generateEventPass(
  eventId: number,
  dependentId: number | null
) {
  return api.post(`/events/${eventId}/passes`, {
    dependent_id: dependentId,
  });
}
