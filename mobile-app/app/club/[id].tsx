import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getClubAnnouncements } from '../../lib/api/announcements';
import { fetchMyClubs } from '../../lib/api/clubs';
import { getClubEvents } from '../../lib/api/events';
import {
  generateEventPass,
  getMyEventPasses,
} from '../../lib/api/event_passes';

type Announcement = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

type ClubEvent = {
  id: number;
  title: string;
  description: string;
  event_date: string;
};

type ClubMember =
  | { type: 'self' }
  | { type: 'dependent'; id: number; name: string; relation: string };

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

  const [showAttend, setShowAttend] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);

  const [alreadyPassed, setAlreadyPassed] = useState<(number | null)[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<(number | null)[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const clubs = await fetchMyClubs();
        const selectedClub = clubs.find(
          (c: Club) => c.club_id === clubId
        );
        setClub(selectedClub || null);

        setAnnouncements(await getClubAnnouncements(clubId));
        setEvents(await getClubEvents(clubId));
      } catch (err) {
        console.error('Failed to load club details', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(clubId)) loadData();
  }, [clubId]);

  async function openAttend(event: ClubEvent) {
    setSelectedEvent(event);
    setSelectedMembers([]);

    try {
      const existing = await getMyEventPasses(event.id);
      setAlreadyPassed(existing);
    } catch (e) {
      console.error(e);
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

    try {
      for (const depId of selectedMembers) {
        await generateEventPass(selectedEvent.id, depId);
      }

      alert('Passes generated successfully');
      setShowAttend(false);
    } catch (err) {
      console.error(err);
      alert('Failed to generate passes');
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        Club Updates
      </Text>

      {/* EVENTS */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Events</Text>

        {events.map((event) => (
          <View
            key={event.id}
            style={{
              marginTop: 12,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: '600' }}>{event.title}</Text>
            <Text>{event.description}</Text>

            <TouchableOpacity
              onPress={() => openAttend(event)}
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: '#000',
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
        {announcements.map((a) => (
          <View
            key={a.id}
            style={{
              marginBottom: 12,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
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

          {/* SELF */}
          <TouchableOpacity
            disabled={alreadyPassed.includes(null)}
            onPress={() => toggleMember(null)}
          >
            <Text style={{ marginTop: 12 }}>
              {alreadyPassed.includes(null) ? '✔' : selectedMembers.includes(null) ? '☑' : '☐'} Self
            </Text>
          </TouchableOpacity>

          {/* DEPENDENTS */}
          {club.members
            .filter((m) => m.type === 'dependent')
            .map((m: any) => (
              <TouchableOpacity
                key={m.id}
                disabled={alreadyPassed.includes(m.id)}
                onPress={() => toggleMember(m.id)}
              >
                <Text style={{ marginTop: 8 }}>
                  {alreadyPassed.includes(m.id)
                    ? '✔'
                    : selectedMembers.includes(m.id)
                    ? '☑'
                    : '☐'}{' '}
                  {m.name} ({m.relation})
                </Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            onPress={confirmAttend}
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#000',
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
