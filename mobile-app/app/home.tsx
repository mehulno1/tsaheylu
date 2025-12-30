import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { fetchMyClubs, type ClubResponse } from '../lib/api/clubs';
import { useAuth } from '../contexts/AuthContext';
import { APIError } from '../lib/api/errors';
import {
  getMembershipStatusConfig,
  membershipAllowsActions,
  getRejectionReasonMessage,
  getActionDisabledMessage,
} from '../lib/membership';
import { getStoredPhoneNumber, maskPhoneNumber } from '../lib/utils/phone';

export default function HomeScreen() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Member');

  useEffect(() => {
    async function loadClubs() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMyClubs();
        setClubs(data);
      } catch (err) {
        console.error('Failed to load clubs:', err);
        const errorMessage =
          err instanceof APIError ? err.userMessage : 'Failed to load clubs. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    async function loadDisplayName() {
      // Try to get stored phone number for greeting
      const phone = await getStoredPhoneNumber();
      if (phone) {
        setDisplayName(maskPhoneNumber(phone));
      } else {
        setDisplayName('Member');
      }
    }

    loadClubs();
    loadDisplayName();
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

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
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
          onPress={async () => {
            try {
              setError(null);
              setLoading(true);
              const data = await fetchMyClubs();
              setClubs(data);
            } catch (err) {
              const errorMessage =
                err instanceof APIError ? err.userMessage : 'Failed to load clubs. Please try again.';
              setError(errorMessage);
            } finally {
              setLoading(false);
            }
          }}
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
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingTop: 40,
      }}
    >
      {/* Greeting */}
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#333' }}>
        Hello, {displayName}
      </Text>

      {/* Header */}
      <Text style={{ fontSize: 26, fontWeight: '700', marginTop: 16 }}>
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
      
      {/* My Event Passes Button */}
      <TouchableOpacity
        onPress={() => router.push('/passes')}
        style={{
          marginTop: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          My Event Passes
        </Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={async () => {
          try {
            await logout();
            // Routing will automatically redirect to login via _layout.tsx
          } catch (error) {
            console.error('Logout failed:', error);
            alert('Failed to logout');
          }
        }}
        style={{
          marginTop: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: '#666',
          borderRadius: 10,
          backgroundColor: '#f5f5f5',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            color: '#666',
          }}
        >
          Logout
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
          const statusConfig = getMembershipStatusConfig(club.status);
          const allowsActions = membershipAllowsActions(club.status);
          const rejectionMessage = getRejectionReasonMessage(
            club.status,
            club.rejection_reason
          );
          const actionDisabledMessage = getActionDisabledMessage(club.status);

          return (
            <TouchableOpacity
              key={club.club_id}
              onPress={() => {
                if (allowsActions) {
                  router.push(`/club/${club.club_id}`);
                } else {
                  // Show explicit message when action is disabled
                  alert(actionDisabledMessage);
                }
              }}
              disabled={!allowsActions}
              activeOpacity={allowsActions ? 0.8 : 1}
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: allowsActions ? '#e0e0e0' : '#d1d5db',
                borderRadius: 10,
                marginBottom: 16,
                opacity: allowsActions ? 1 : 0.7,
                backgroundColor: allowsActions ? '#ffffff' : '#f9fafb',
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
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: statusConfig.color,
                    fontWeight: '600',
                  }}
                >
                  {statusConfig.label}
                </Text>

                {/* Status explanation */}
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: '#666',
                  }}
                >
                  {statusConfig.explanation}
                </Text>

                {/* Rejection reason - always shown when status is rejected */}
                {rejectionMessage && (
                  <View
                    style={{
                      marginTop: 8,
                      padding: 10,
                      backgroundColor: '#fef2f2',
                      borderRadius: 6,
                      borderLeftWidth: 3,
                      borderLeftColor: statusConfig.color,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#991b1b',
                        fontWeight: '500',
                      }}
                    >
                      Rejection Reason:
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: '#7f1d1d',
                      }}
                    >
                      {rejectionMessage}
                    </Text>
                  </View>
                )}

                {/* Action disabled message - shown when actions are not allowed */}
                {!allowsActions && (
                  <View
                    style={{
                      marginTop: 8,
                      padding: 10,
                      backgroundColor: '#fffbeb',
                      borderRadius: 6,
                      borderLeftWidth: 3,
                      borderLeftColor: statusConfig.color,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#92400e',
                        fontStyle: 'italic',
                      }}
                    >
                      {actionDisabledMessage}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
