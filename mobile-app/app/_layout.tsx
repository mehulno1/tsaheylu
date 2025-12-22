import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { loadAuthToken } from '../lib/api/client';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await loadAuthToken();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return null; // or splash later
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
