import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { fetchMyClubs, fetchAllClubs, requestMembershipsBatch, type ClubResponse, type AllClub } from '../lib/api/clubs';
import { getDependents, type Dependent } from '../lib/api/dependents';
import { useAuth } from '../contexts/AuthContext';
import { APIError } from '../lib/api/errors';
import {
  getMembershipStatusConfig,
  membershipAllowsActions,
  getRejectionReasonMessage,
  getActionDisabledMessage,
  type MembershipStatus,
} from '../lib/membership';
import { getStoredPhoneNumber, maskPhoneNumber } from '../lib/utils/phone';

export default function HomeScreen() {
  const { logout } = useAuth();
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [allClubs, setAllClubs] = useState<AllClub[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Member');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<AllClub | null>(null);
  const [selectedClubMembership, setSelectedClubMembership] = useState<ClubResponse | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<number | null>>(new Set());
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [myClubsData, allClubsData, dependentsData] = await Promise.all([
          fetchMyClubs(),
          fetchAllClubs(),
          getDependents().catch(() => [] as Dependent[]),
        ]);
        setClubs(myClubsData);
        setAllClubs(allClubsData);
        setDependents(dependentsData);
      } catch (err) {
        console.error('Failed to load data:', err);
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

    loadData();
    loadDisplayName();
  }, []);

  // Get clubs user is not a member of
  const memberClubIds = new Set(clubs.map((c) => c.club_id));
  const availableClubs = allClubs.filter((c) => !memberClubIds.has(c.club_id));
  
  // Get clubs where user is a member but some dependents might not be
  // Show "Request for Family Members" button when user is active member and has dependents not yet members
  const clubsWithMissingDependents = clubs.filter((club) => {
    // Only show for active memberships (user can request for dependents)
    if (club.status === 'active' && dependents.length > 0) {
      const memberDependentNames = new Set(
        club.members
          .filter((m) => m.type === 'dependent')
          .map((m) => `${m.name}|${m.relation}`)
      );
      // Check if any dependent is not yet a member
      return dependents.some((d) => !memberDependentNames.has(`${d.name}|${d.relation}`));
    }
    return false;
  });

  // Helper to get membership status for a specific member in a club
  function getMemberStatus(
    club: ClubResponse | null,
    dependentId: number | null
  ): MembershipStatus | null {
    if (!club) return null;
    
    if (dependentId === null) {
      // Check self membership
      const hasSelf = club.members.some((m) => m.type === 'self');
      return hasSelf ? club.status : null;
    }
    
    // Check dependent membership
    const dependent = dependents.find((d) => d.id === dependentId);
    if (!dependent) return null;
    
    const member = club.members.find(
      (m) =>
        m.type === 'dependent' &&
        m.name === dependent.name &&
        m.relation === dependent.relation
    );
    
    return member ? club.status : null;
  }

  function isMemberDisabled(
    club: ClubResponse | null,
    dependentId: number | null
  ): boolean {
    const status = getMemberStatus(club, dependentId);
    // Disable if already active or pending
    return status === 'active' || status === 'pending';
  }

  function toggleMemberSelection(dependentId: number | null) {
    if (requesting) return;
    
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(dependentId)) {
      newSelection.delete(dependentId);
    } else {
      newSelection.add(dependentId);
    }
    setSelectedMembers(newSelection);
  }

  async function handleRequestMemberships() {
    if (!selectedClub || requesting || selectedMembers.size === 0) return;

    try {
      setRequesting(true);
      const dependentIds = Array.from(selectedMembers);
      const result = await requestMembershipsBatch(selectedClub.club_id, dependentIds);
      
      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;
      
      let message = `Membership request${createdCount > 1 ? 's' : ''} submitted successfully!`;
      if (skippedCount > 0) {
        message += `\n${skippedCount} member${skippedCount > 1 ? 's' : ''} already have membership.`;
      }
      
      alert(message);
      setShowRequestModal(false);
      setSelectedClub(null);
      setSelectedClubMembership(null);
      setSelectedMembers(new Set());
      
      // Reload clubs to show the new pending memberships
      const data = await fetchMyClubs();
      setClubs(data);
    } catch (err) {
      console.error('Failed to request membership:', err);
      const errorMessage =
        err instanceof APIError
          ? err.userMessage
          : 'Failed to request membership. Please try again.';
      alert(errorMessage);
    } finally {
      setRequesting(false);
    }
  }

  function openRequestModal(club: AllClub) {
    const membership = clubs.find((c) => c.club_id === club.club_id);
    setSelectedClub(club);
    setSelectedClubMembership(membership || null);
    setSelectedMembers(new Set());
    setShowRequestModal(true);
  }

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
        {/* My Clubs Section */}
        {clubs.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              My Clubs
            </Text>
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
          </>
        )}

        {/* Available Clubs Section */}
        {availableClubs.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginTop: clubs.length > 0 ? 24 : 0,
                marginBottom: 12,
              }}
            >
              Available Clubs
            </Text>
            {availableClubs.map((club) => (
              <TouchableOpacity
                key={club.club_id}
                onPress={() => openRequestModal(club)}
                style={{
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 10,
                  marginBottom: 16,
                  backgroundColor: '#ffffff',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600' }}>
                  {club.club_name}
                </Text>
                <TouchableOpacity
                  onPress={() => openRequestModal(club)}
                  style={{
                    marginTop: 12,
                    padding: 10,
                    backgroundColor: '#000',
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                    Request Membership
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            
            {/* Clubs where user is a member but some dependents are not */}
            {clubsWithMissingDependents.map((club) => {
              const statusConfig = getMembershipStatusConfig(club.status);
              return (
                <TouchableOpacity
                  key={club.club_id}
                  onPress={() => openRequestModal({ club_id: club.club_id, club_name: club.club_name })}
                  style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderRadius: 10,
                    marginBottom: 16,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '600' }}>
                    {club.club_name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                    Some family members are not members yet
                  </Text>
                  <TouchableOpacity
                    onPress={() => openRequestModal({ club_id: club.club_id, club_name: club.club_name })}
                    style={{
                      marginTop: 12,
                      padding: 10,
                      backgroundColor: '#000',
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      Request for Family Members
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {clubs.length === 0 && availableClubs.length === 0 && (
          <Text style={{ marginTop: 20, color: '#666' }}>
            No clubs available.
          </Text>
        )}
      </ScrollView>

      {/* Request Membership Modal */}
      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!requesting) {
            setShowRequestModal(false);
            setSelectedClub(null);
          }
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
              Request Membership
            </Text>
            {selectedClub && (
              <Text style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
                {selectedClub.club_name}
              </Text>
            )}

            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
              Select members to request membership for:
            </Text>

            {/* Self Option */}
            {(() => {
              const isDisabled = isMemberDisabled(selectedClubMembership, null);
              const status = getMemberStatus(selectedClubMembership, null);
              const isSelected = selectedMembers.has(null);
              
              return (
                <TouchableOpacity
                  disabled={requesting || isDisabled}
                  onPress={() => toggleMemberSelection(null)}
                  style={{
                    padding: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? '#000' : isDisabled ? '#ccc' : '#e0e0e0',
                    borderRadius: 8,
                    marginBottom: 12,
                    backgroundColor: isDisabled ? '#f5f5f5' : isSelected ? '#f0f0f0' : '#fff',
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>
                      {isSelected ? '☑' : '☐'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>Self</Text>
                      {status && (
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          {status === 'active' ? 'Already a member' : status === 'pending' ? 'Request pending' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })()}

            {/* Dependent Options */}
            {dependents.map((dep) => {
              const isDisabled = isMemberDisabled(selectedClubMembership, dep.id);
              const status = getMemberStatus(selectedClubMembership, dep.id);
              const isSelected = selectedMembers.has(dep.id);
              
              return (
                <TouchableOpacity
                  key={dep.id}
                  disabled={requesting || isDisabled}
                  onPress={() => toggleMemberSelection(dep.id)}
                  style={{
                    padding: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? '#000' : isDisabled ? '#ccc' : '#e0e0e0',
                    borderRadius: 8,
                    marginBottom: 12,
                    backgroundColor: isDisabled ? '#f5f5f5' : isSelected ? '#f0f0f0' : '#fff',
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>
                      {isSelected ? '☑' : '☐'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>
                        {dep.name}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#666' }}>{dep.relation}</Text>
                      {status && (
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          {status === 'active' ? 'Already a member' : status === 'pending' ? 'Request pending' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {dependents.length === 0 && (
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                No dependents added yet. Add family members to request membership for them.
              </Text>
            )}

            <TouchableOpacity
              disabled={requesting || selectedMembers.size === 0}
              onPress={handleRequestMemberships}
              style={{
                marginTop: 20,
                padding: 14,
                backgroundColor: requesting || selectedMembers.size === 0 ? '#ccc' : '#000',
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                {requesting
                  ? 'Submitting...'
                  : `Request Membership${selectedMembers.size > 1 ? 's' : ''} (${selectedMembers.size})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={requesting}
              onPress={() => {
                setShowRequestModal(false);
                setSelectedClub(null);
                setSelectedClubMembership(null);
                setSelectedMembers(new Set());
              }}
              style={{
                marginTop: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                backgroundColor: requesting ? '#f5f5f5' : '#fff',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
