import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { fetchMyClubs } from '../lib/api/clubs';

type ClubMember =
  | { type: 'self' }
  | { type: 'dependent'; name: string; relation: string };

type ClubStatus = 'active' | 'pending' | 'rejected' | 'expired';

type Club = {
  club_id: number;
  club_name: string;
  status: ClubStatus;
  rejection_reason?: string | null;
  expiry_date: string | null;
  members: ClubMember[];
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
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        Your Clubs
      </Text>

      <Text style={{ marginTop: 6, fontSize: 14, color: '#666' }}>
        Manage memberships, renewals and updates
      </Text>

      {/* Family Members Button */}
      <TouchableOpacity
        onPress={() => router.push('/family')}
        style={{
          marginTop: 20,
          padding: 14,
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 10,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Family Members
        </Text>
      </TouchableOpacity>

      {/* Club List */}
      <ScrollView style={{ marginTop: 24 }} showsVerticalScrollIndicator={false}>
        {clubs.length === 0 && (
          <Text style={{ marginTop: 20, color: '#666' }}>
            You are not a member of any clubs yet.
          </Text>
        )}

        {clubs.map((club) => {
          const isActive = club.status === 'active';

          const statusColor =
            club.status === 'active'
              ? 'green'
              : club.status === 'pending'
              ? '#d97706'
              : 'red';

          return (
            <TouchableOpacity
              key={club.club_id}
              onPress={() => {
                if (isActive) {
                  router.push(`/club/${club.club_id}`);
                }
              }}
              disabled={!isActive}
              activeOpacity={isActive ? 0.8 : 1}
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 10,
                marginBottom: 16,
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {club.club_name}
              </Text>

              {/* Members list */}
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 14, color: '#444', fontWeight: '500' }}>
                  Members:
                </Text>

                {club.members.map((member, index) => (
                  <Text
                    key={index}
                    style={{ fontSize: 14, color: '#555', marginTop: 2 }}
                  >
                    •{' '}
                    {member.type === 'self'
                      ? 'Self'
                      : `${member.name} (${member.relation})`}
                  </Text>
                ))}
              </View>

              {/* Membership status */}
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: statusColor,
                  fontWeight: '500',
                }}
              >
                {club.status === 'active' && 'Membership Active'}
                {club.status === 'pending' && 'Pending Approval'}
                {club.status === 'rejected' && 'Membership Rejected'}
                {club.status === 'expired' && 'Membership Expired'}
              </Text>

              {/* Rejection reason */}
              {club.status === 'rejected' && club.rejection_reason && (
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: '#444',
                  }}
                >
                  Reason: {club.rejection_reason}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
