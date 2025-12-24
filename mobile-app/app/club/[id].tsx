import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getClubAnnouncements } from '../../lib/api/announcements';
import { fetchMyClubs } from '../../lib/api/clubs';
import { getClubEvents } from '../../lib/api/events';

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
  location: string | null;
  requires_pass: boolean;
};

type ClubMember =
  | { type: 'self' }
  | { type: 'dependent'; name: string; relation: string };

type Club = {
  club_id: number;
  club_name: string;
  members: ClubMember[];
};

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const clubId = Number(id);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load club list to get members
        const clubs = await fetchMyClubs();
        const selectedClub = clubs.find(
          (c: Club) => c.club_id === clubId
        );
        setClub(selectedClub || null);

        // Load announcements & events
        const [announcementsData, eventsData] = await Promise.all([
          getClubAnnouncements(clubId),
          getClubEvents(clubId),
        ]);

        setAnnouncements(announcementsData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to load club details', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(clubId)) {
      loadData();
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

      {/* Members Section */}
      {club && (
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#444',
            }}
          >
            Members
          </Text>

          {club.members.map((member, index) => (
            <Text
              key={index}
              style={{
                marginTop: 4,
                fontSize: 14,
                color: '#555',
              }}
            >
              •{' '}
              {member.type === 'self'
                ? 'Self'
                : `${member.name} (${member.relation})`}
            </Text>
          ))}
        </View>
      )}

      {/* Announcements */}
      <View style={{ marginTop: 24 }}>
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

      {/* Events */}
      <View style={{ marginTop: 32 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
          }}
        >
          Events
        </Text>

        {!loading && events.length === 0 && (
          <Text style={{ marginTop: 8, color: '#666' }}>
            No upcoming events.
          </Text>
        )}

        {events.map((event) => (
          <View
            key={event.id}
            style={{
              marginTop: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {event.title}
            </Text>

            {event.description && (
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: '#444',
                }}
              >
                {event.description}
              </Text>
            )}

            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                color: '#666',
              }}
            >
              {new Date(event.event_date).toLocaleString()}
              {event.location ? ` • ${event.location}` : ''}
            </Text>

            {event.requires_pass && (
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#2563eb',
                  fontWeight: '500',
                }}
              >
                Pass required
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
