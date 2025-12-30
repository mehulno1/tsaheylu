import { getSharedAuthToken } from '../../contexts/AuthContext';

const BASE_URL = __DEV__
  // 'http://192.168.1.118:8000'
  //? 'http://192.168.29.19:8000'
  ? 'http://192.168.1.242:8000'
  : 'https://api.clubvision.in'; // later
  
  // Legacy functions kept for backward compatibility but deprecated
  // Token management is now handled by AuthContext
  export async function setAuthToken(token: string) {
    // This function is deprecated - use AuthContext.setToken instead
    // Kept for backward compatibility
  }
  
  export async function loadAuthToken() {
    // This function is deprecated - token loading is handled by AuthContext
    // Kept for backward compatibility
    return null;
  }
  
  export function clearAuthToken() {
    // This function is deprecated - use AuthContext.logout instead
    // Kept for backward compatibility
    return Promise.resolve();
  }
  
  export function getAuthToken() {
    // This function now reads from shared token managed by AuthContext
    return getSharedAuthToken();
  }
  
  async function request(
    path: string,
    options: RequestInit = {}
  ) {
    const authToken = getSharedAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    };
  
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'API request failed');
    }
  
    return response.json();
  }
  
  export const api = {
    get: (path: string) => request(path),
    post: (path: string, body: any) =>
      request(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };
  
