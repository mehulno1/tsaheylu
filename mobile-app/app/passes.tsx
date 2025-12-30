import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { getMyPasses } from '../lib/api/passes';
import { APIError } from '../lib/api/errors';

type Pass = {
  id: number;
  pass_code: string;
  event_title: string;
  club_name: string;
  member: string;
};

export default function MyPassesScreen() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPasses();
      setPasses(data);
    } catch (e) {
      console.error('Failed to load passes:', e);
      const errorMessage =
        e instanceof APIError ? e.userMessage : 'Failed to load passes. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasses();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <Text>Loading passes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: '#d32f2f',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadPasses}
          style={{
            backgroundColor: '#000',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
        }}
      >
        My Event Passes
      </Text>

      {passes.length === 0 && (
        <Text style={{ marginTop: 20, color: '#666' }}>
          No passes generated yet.
        </Text>
      )}

      {passes.map((p) => (
        <View
          key={p.id}
          style={{
            marginTop: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600' }}>
            {p.event_title}
          </Text>

          <Text style={{ marginTop: 4 }}>
            {p.club_name}
          </Text>

          <Text style={{ marginTop: 4 }}>
            Member: {p.member}
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#999',
            }}
          >
            Pass Code: {p.pass_code}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
