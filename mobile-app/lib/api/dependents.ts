import { api } from './client';

export async function getDependents() {
  return api.get('/me/dependents');
}

export async function addDependent(data: {
  name: string;
  relation: string;
  date_of_birth?: string;
}) {
  return api.post('/me/dependents', data);
}
