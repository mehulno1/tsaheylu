import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't show login screen if still loading or if authenticated
  // (routing is handled by _layout.tsx)
  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        Tsaheylu
      </Text>

      <Text
        style={{
          marginTop: 12,
          fontSize: 16,
          color: '#666',
          textAlign: 'center',
        }}
      >
        One app for all your clubs, memberships and events
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/phone')}
        style={{
          marginTop: 32,
          backgroundColor: '#000',
          paddingVertical: 14,
          borderRadius: 8,
        }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

