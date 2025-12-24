import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { getClubAnnouncements } from '../../lib/api/announcements';
import { fetchMyClubs } from '../../lib/api/clubs';
import { getClubEvents } from '../../lib/api/events';
import { generateEventPass } from '../../lib/api/event_passes';

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
  | { type: 'dependent'; name: string; relation: string; id: number };

type Club = {
  club_id: number;
  club_name: string;
  members: ClubMember[];
};

type SelectedMember =
  | { type: 'self' }
  | { type: 'dependent'; id: number };

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams();
  const clubId = Number(id);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAttend, setShowAttend] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

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

  function toggleMember(member: SelectedMember) {
    setSelectedMembers((prev) => {
      const exists =
        member.type === 'self'
          ? prev.some((m) => m.type === 'self')
          : prev.some(
              (m) => m.type === 'dependent' && m.id === member.id
            );

      if (exists) {
        return prev.filter((m) => {
          if (member.type === 'self') {
            return m.type !== 'self';
          }
          return !(m.type === 'dependent' && m.id === member.id);
        });
      }

      return [...prev, member];
    });
  }

  async function confirmAttend() {
    if (!selectedEvent || selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    try {
      for (const m of selectedMembers) {
        await generateEventPass(
          selectedEvent.id,
          m.type === 'self' ? null : m.id
        );
      }

      alert('Pass generated successfully');
      setShowAttend(false);
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
      alert('Failed to generate passes');
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center' }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        Club Updates
      </Text>

      {/* MEMBERS */}
      {club && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>
            Members
          </Text>
          {club.members.map((m, i) => (
            <Text key={i} style={{ marginTop: 4 }}>
              • {m.type === 'self' ? 'Self' : `${m.name} (${m.relation})`}
            </Text>
          ))}
        </View>
      )}

      {/* EVENTS */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>
          Events
        </Text>

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

            <Pressable
              onPress={() => {
                setSelectedEvent(event);
                setShowAttend(true);
                setSelectedMembers([]);
              }}
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
            </Pressable>
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

      {/* ATTEND MODAL */}
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

          <Pressable onPress={() => toggleMember({ type: 'self' })}>
            <Text style={{ marginTop: 12 }}>
              {selectedMembers.some((m) => m.type === 'self') ? '☑' : '☐'} Self
            </Text>
          </Pressable>

          {club.members
            .filter((m) => m.type === 'dependent')
            .map((m: any, i) => (
              <Pressable
                key={i}
                onPress={() =>
                  toggleMember({
                    type: 'dependent',
                    id: m.id,
                  })
                }
              >
                <Text style={{ marginTop: 8 }}>
                  {selectedMembers.some(
                    (sm) => sm.type === 'dependent' && sm.id === m.id
                  )
                    ? '☑'
                    : '☐'}{' '}
                  {m.name} ({m.relation})
                </Text>
              </Pressable>
            ))}

          <Pressable
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
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
