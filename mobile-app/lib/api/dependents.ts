import { api } from './client';

export type Dependent = {
  id: number;
  name: string;
  relation: string;
};

export async function getDependents(): Promise<Dependent[]> {
  return api.get('/me/dependents');
}

export async function addDependent(data: {
  name: string;
  relation: string;
  date_of_birth?: string;
}) {
  return api.post('/me/dependents', data);
}
