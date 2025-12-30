import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getClubAnnouncements } from '../../lib/api/announcements';
import { fetchMyClubs, type ClubResponse } from '../../lib/api/clubs';
import { getClubEvents } from '../../lib/api/events';
import {
  generateEventPass,
  getMyEventPasses,
} from '../../lib/api/event_passes';
import { getDependents } from '../../lib/api/dependents';
import { APIError } from '../../lib/api/errors';
import {
  getMembershipStatusConfig,
  membershipAllowsActions,
  getRejectionReasonMessage,
  getActionDisabledMessage,
} from '../../lib/membership';

type Announcement = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

type ClubEvent = {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
};

type Dependent = {
  id: number;
  name: string;
  relation: string;
};

type ClubMember =
  | { type: 'self' }
  | { type: 'dependent'; id: number; name: string; relation: string };

type Club = ClubResponse & {
  members: ClubMember[];
};

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const clubId = Number(id);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [club, setClub] = useState<Club | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAttend, setShowAttend] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);

  const [alreadyPassed, setAlreadyPassed] = useState<(number | null)[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<(number | null)[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clubs, deps] = await Promise.all([
        fetchMyClubs(),
        getDependents().catch(() => [] as Dependent[]),
      ]);
      
      setDependents(deps);
      
      const selectedClub = clubs.find(
        (c) => c.club_id === clubId
      );
      
      if (!selectedClub) {
        setError('Club not found');
        setLoading(false);
        return;
      }

      // Enrich club members with dependent IDs by matching name and relation
      // The API returns dependents with name/relation but not ID, so we match
      // against the full dependents list to get IDs for pass generation
      const enrichedMembers: ClubMember[] = selectedClub.members.map((m) => {
        if (m.type === 'self') {
          return { type: 'self' };
        }
        // Find matching dependent by name and relation to get the ID
        const dependent = deps.find(
          (d: Dependent) => d.name === m.name && d.relation === m.relation
        );
        if (dependent) {
          return {
            type: 'dependent',
            id: dependent.id,
            name: m.name,
            relation: m.relation,
          };
        }
        // If no match found, we can't use this dependent for pass generation
        // but we'll still show it in the UI with an invalid ID
        return {
          type: 'dependent',
          id: -1, // Invalid ID to prevent pass generation
          name: m.name,
          relation: m.relation,
        };
      });

      const enrichedClub: Club = {
        ...selectedClub,
        members: enrichedMembers,
      };

      setClub(enrichedClub);

      // Only load club data if membership allows actions
      if (membershipAllowsActions(selectedClub.status)) {
        setAnnouncements(await getClubAnnouncements(clubId));
        setEvents(await getClubEvents(clubId));
      } else {
        // Set empty arrays if membership doesn't allow actions
        setAnnouncements([]);
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load club details', err);
      const errorMessage =
        err instanceof APIError ? err.userMessage : 'Failed to load club details. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(clubId)) loadData();
  }, [clubId]);

  async function openAttend(event: ClubEvent) {
    if (!club) return;

    // Check membership status before allowing action
    if (!membershipAllowsActions(club.status)) {
      const message = getActionDisabledMessage(club.status);
      alert(message);
      return;
    }

    setSelectedEvent(event);
    setSelectedMembers([]);

    try {
      const existing = await getMyEventPasses(event.id);
      setAlreadyPassed(existing);
    } catch (e) {
      console.error('Failed to load existing passes:', e);
      // Don't block the UI if this fails, just show empty list
      setAlreadyPassed([]);
    }

    setShowAttend(true);
  }

  function toggleMember(id: number | null) {
    setSelectedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function confirmAttend() {
    if (!selectedEvent || selectedMembers.length === 0) {
      alert('Select at least one member');
      return;
    }

    if (!club) return;

    // Check membership status before allowing action
    if (!membershipAllowsActions(club.status)) {
      const message = getActionDisabledMessage(club.status);
      alert(message);
      return;
    }

    try {
      for (const depId of selectedMembers) {
        await generateEventPass(selectedEvent.id, depId);
      }

      alert('Passes generated successfully');
      setShowAttend(false);
      // Refresh data to show new passes
      loadData();
    } catch (err) {
      console.error('Failed to generate passes:', err);
      const errorMessage =
        err instanceof APIError ? err.userMessage : 'Failed to generate passes. Please try again.';
      alert(errorMessage);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading…</Text>
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
          onPress={loadData}
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

  if (!club) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Club not found</Text>
      </View>
    );
  }

  const statusConfig = getMembershipStatusConfig(club.status);
  const allowsActions = membershipAllowsActions(club.status);
  const rejectionMessage = getRejectionReasonMessage(
    club.status,
    club.rejection_reason
  );
  const actionDisabledMessage = getActionDisabledMessage(club.status);

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        {club.club_name}
      </Text>

      {/* Membership Status Banner */}
      <View
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: allowsActions ? '#f0fdf4' : '#fef2f2',
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: statusConfig.color,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: statusConfig.color,
          }}
        >
          {statusConfig.label}
        </Text>
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
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#991b1b',
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

        {/* Action disabled message */}
        {!allowsActions && (
          <View style={{ marginTop: 8 }}>
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

      {/* EVENTS */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Events</Text>

        {!allowsActions && (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#fffbeb',
              borderRadius: 8,
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

        {allowsActions && events.length === 0 && (
          <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
            No events scheduled at this time.
          </Text>
        )}

        {events.map((event) => (
          <View
            key={event.id}
            style={{
              marginTop: 12,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              opacity: allowsActions ? 1 : 0.6,
            }}
          >
            <Text style={{ fontWeight: '600' }}>{event.title}</Text>
            <Text>{event.description}</Text>

            <TouchableOpacity
              onPress={() => openAttend(event)}
              disabled={!allowsActions}
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: allowsActions ? '#000' : '#9ca3af',
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>
                Attend
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ANNOUNCEMENTS */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Announcements</Text>

        {!allowsActions && (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#fffbeb',
              borderRadius: 8,
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

        {allowsActions && announcements.length === 0 && (
          <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
            No announcements at this time.
          </Text>
        )}

        {announcements.map((a) => (
          <View
            key={a.id}
            style={{
              marginTop: 12,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              opacity: allowsActions ? 1 : 0.6,
            }}
          >
            <Text style={{ fontWeight: '600' }}>{a.title}</Text>
            <Text>{a.message}</Text>
          </View>
        ))}
      </View>

      {/* ATTEND SHEET */}
      {showAttend && club && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            padding: 20,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            Attend as
          </Text>

          {!allowsActions && (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#fffbeb',
                borderRadius: 8,
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

          {/* SELF */}
          <TouchableOpacity
            disabled={alreadyPassed.includes(null) || !allowsActions}
            onPress={() => {
              if (!allowsActions) {
                alert(actionDisabledMessage);
                return;
              }
              toggleMember(null);
            }}
          >
            <Text
              style={{
                marginTop: 12,
                color: !allowsActions ? '#9ca3af' : '#000',
              }}
            >
              {alreadyPassed.includes(null) ? '✔' : selectedMembers.includes(null) ? '☑' : '☐'} Self
              {alreadyPassed.includes(null) && ' (Pass already generated)'}
            </Text>
          </TouchableOpacity>

          {/* DEPENDENTS */}
          {club.members
            .filter((m): m is Extract<ClubMember, { type: 'dependent' }> => m.type === 'dependent')
            .map((m) => {
              const hasValidId = m.id > 0;
              const isDisabled = !hasValidId || alreadyPassed.includes(m.id) || !allowsActions;
              return (
                <TouchableOpacity
                  key={`${m.type}-${m.id}`}
                  disabled={isDisabled}
                  onPress={() => {
                    if (!allowsActions) {
                      alert(actionDisabledMessage);
                      return;
                    }
                    if (!hasValidId) {
                      alert('Unable to generate pass for this dependent. Please refresh the page.');
                      return;
                    }
                    toggleMember(m.id);
                  }}
                >
                <Text
                  style={{
                    marginTop: 8,
                    color: !allowsActions ? '#9ca3af' : '#000',
                  }}
                >
                  {alreadyPassed.includes(m.id)
                    ? '✔'
                    : selectedMembers.includes(m.id)
                    ? '☑'
                    : '☐'}{' '}
                  {m.name} ({m.relation})
                  {alreadyPassed.includes(m.id) && ' (Pass already generated)'}
                  {!hasValidId && ' (Unable to generate pass)'}
                </Text>
              </TouchableOpacity>
              );
            })}

          <TouchableOpacity
            onPress={confirmAttend}
            disabled={!allowsActions}
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: allowsActions ? '#000' : '#9ca3af',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
