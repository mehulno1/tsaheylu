import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { fetchMyClubs } from '../lib/api/clubs';

type Club = {
  club_id: number;
  club_name: string;
  role: string;
  status: string;
  expiry_date: string | null;
};

export default function HomeScreen() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClubs() {
      try {
        const data = await fetchMyClubs();
        setClubs(data);
      } catch (error) {
        console.error(error);
        alert('Failed to load clubs');
      } finally {
        setLoading(false);
      }
    }

    loadClubs();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Text>Loading your clubs...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingTop: 40,
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
        }}
      >
        Your Clubs
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: '#666',
        }}
      >
        Manage memberships, renewals and updates
      </Text>

      {/* Club List */}
      <ScrollView
        style={{ marginTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {clubs.length === 0 && (
          <Text style={{ marginTop: 20, color: '#666' }}>
            You are not a member of any clubs yet.
          </Text>
        )}

        {clubs.map((club) => (
          <TouchableOpacity
            key={club.club_id}
            onPress={() => router.push(`/club/${club.club_id}`)}
            activeOpacity={0.8}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
              }}
            >
              {club.club_name}
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: club.status === 'active' ? 'green' : '#d97706',
              }}
            >
              Membership Status: {club.status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
