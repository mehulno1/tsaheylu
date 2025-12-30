/**
 * Shared token storage and logout callback management
 * This module breaks the circular dependency between AuthContext and API client
 */

// Shared token variable for client.ts to access
let sharedAuthToken: string | null = null;

export function getSharedAuthToken(): string | null {
  return sharedAuthToken;
}

export function setSharedAuthToken(token: string | null): void {
  sharedAuthToken = token;
}

// Logout callback - set by AuthContext, called by API client on auth errors
let logoutCallback: (() => Promise<void>) | null = null;

export function getLogoutCallback(): (() => Promise<void>) | null {
  return logoutCallback;
}

export function setLogoutCallback(callback: (() => Promise<void>) | null): void {
  logoutCallback = callback;
}

