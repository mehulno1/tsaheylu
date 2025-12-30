import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Protected routes that require authentication
const PROTECTED_ROUTES = ['home', 'club', 'passes', 'family'];

// Login routes that should redirect if authenticated
const LOGIN_ROUTES = ['phone', 'otp'];

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      // Wait for auth to resolve before routing
      return;
    }

    const currentRoute = segments[0];

    if (!isAuthenticated) {
      // User is not authenticated
      // Redirect to index if on a protected route
      if (currentRoute && PROTECTED_ROUTES.includes(currentRoute)) {
        router.replace('/');
      }
    } else {
      // User is authenticated
      // Redirect to home if on index or login routes
      if (currentRoute === undefined || LOGIN_ROUTES.includes(currentRoute)) {
        router.replace('/home');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return null; // Wait for auth to load
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
