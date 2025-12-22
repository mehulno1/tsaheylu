import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

const BASE_URL = __DEV__
  //? 'http://192.168.1.242:8000'
  ? 'http://192.168.29.19:8000'
  //: 'http://192.168.1.242:8000'
  : 'https://api.clubvision.in'; // later
  
  let authToken: string | null = null;
  
  export async function setAuthToken(token: string) {
    authToken = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
  
  export async function loadAuthToken() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      authToken = token;
    }
    return token;
  }
  
  export function clearAuthToken() {
    authToken = null;
    return AsyncStorage.removeItem(TOKEN_KEY);
  }
  
  export function getAuthToken() {
    return authToken;
  }
  
  async function request(
    path: string,
    options: RequestInit = {}
  ) {
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
  
