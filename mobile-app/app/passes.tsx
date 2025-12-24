import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { getMyPasses } from '../lib/api/passes';

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

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyPasses();
        setPasses(data);
      } catch (e) {
        console.error(e);
        alert('Failed to load passes');
      } finally {
        setLoading(false);
      }
    }

    load();
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
