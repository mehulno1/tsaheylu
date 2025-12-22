import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getClubAnnouncements } from '../../lib/api/announcements';

type Announcement = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const clubId = Number(id);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await getClubAnnouncements(clubId);
        setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load announcements', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(clubId)) {
      loadAnnouncements();
    }
  }, [clubId]);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
      }}
    >
      {/* Club Header */}
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
        }}
      >
        Club Updates
      </Text>

      {/* Announcements */}
      <View style={{ marginTop: 20 }}>
        {loading && <Text>Loading announcements...</Text>}

        {!loading && announcements.length === 0 && (
          <Text style={{ color: '#666' }}>
            No announcements yet.
          </Text>
        )}

        {announcements.map((item) => (
          <View
            key={item.id}
            style={{
              marginBottom: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {item.title}
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: '#444',
              }}
            >
              {item.message}
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#999',
              }}
            >
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
