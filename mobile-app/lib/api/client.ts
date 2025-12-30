import { getSharedAuthToken } from '../../contexts/AuthContext';
import { APIError } from './errors';

const BASE_URL = __DEV__
  // 'http://192.168.1.118:8000'
  //? 'http://192.168.29.19:8000'
  ? 'http://192.168.1.242:8000'
  : 'https://api.clubvision.in'; // later

// Logout callback - set by AuthContext
let logoutCallback: (() => Promise<void>) | null = null;

export function setLogoutCallback(callback: (() => Promise<void>) | null) {
  logoutCallback = callback;
}
  
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
  
  let response: Response;
  let responseText: string = '';
  
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    
    // Try to read response text, but don't fail if it's not text
    try {
      responseText = await response.text();
    } catch {
      responseText = '';
    }
  } catch (error) {
    // Network error or fetch failed
    if (error instanceof Error) {
      throw new APIError(
        error.message || 'Network error. Please check your connection.',
        0,
        ''
      );
    }
    throw new APIError('Network error. Please check your connection.', 0, '');
  }
  
  if (!response.ok) {
    const statusCode = response.status;
    
    // Handle authentication errors
    if (statusCode === 401 || statusCode === 403) {
      // Trigger logout if callback is set
      if (logoutCallback) {
        try {
          await logoutCallback();
        } catch (logoutError) {
          console.error('Failed to logout on auth error:', logoutError);
        }
      }
    }
    
    // Try to parse error message from response
    let errorMessage = 'Request failed';
    try {
      if (responseText) {
        const parsed = JSON.parse(responseText);
        errorMessage = parsed.detail || parsed.message || parsed.error || errorMessage;
      }
    } catch {
      // If parsing fails, use response text if available
      if (responseText) {
        errorMessage = responseText;
      }
    }
    
    throw new APIError(errorMessage, statusCode, responseText);
  }
  
  // Parse JSON response
  try {
    return responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    // If response is not JSON, return empty object
    return {};
  }
}
  
export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: any) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
  
