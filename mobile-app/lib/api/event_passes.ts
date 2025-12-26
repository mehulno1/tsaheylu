import { api } from './client';

export async function generateEventPass(
  eventId: number,
  dependentId: number | null
) {
  return api.post(`/events/${eventId}/passes`, {
    dependent_id: dependentId,
  });
}

export async function getMyEventPasses(eventId: number) {
  return api.get(`/events/${eventId}/passes/me`);
}
