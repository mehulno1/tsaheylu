import { api } from './client';

export async function getMyPasses() {
  return api.get('/me/passes');
}
