import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

// Shared token variable for client.ts to access
let sharedAuthToken: string | null = null;

export function getSharedAuthToken(): string | null {
  return sharedAuthToken;
}

export function setSharedAuthToken(token: string | null): void {
  sharedAuthToken = token;
}

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from AsyncStorage on mount
  useEffect(() => {
    async function loadToken() {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          setSharedAuthToken(token);
        }
      } catch (error) {
        console.error('Failed to load auth token:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadToken();
  }, []);

  const setToken = async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      setSharedAuthToken(token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setSharedAuthToken(null);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
      throw error;
    }
  };

  const isAuthenticated = authToken !== null;

  return (
    <AuthContext.Provider
      value={{
        authToken,
        isAuthenticated,
        isLoading,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

