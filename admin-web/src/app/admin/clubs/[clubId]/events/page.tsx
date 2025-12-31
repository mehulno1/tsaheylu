'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Event = {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  requires_pass: boolean;
};

export default function ClubEventsPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // ✅ Read localStorage ONLY on client
  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) {
      alert('Admin session expired. Please login again.');
      router.push('/admin/login');
      return;
    }
    setToken(t);
  }, [router]);

  // ✅ Load events only AFTER token is available
  useEffect(() => {
    if (!token) return;

    async function loadEvents() {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/clubs/${clubId}/events`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error('Unexpected response:', data);
          alert('Failed to load events');
          setEvents([]);
          return;
        }

        setEvents(data);
      } catch (err) {
        alert('Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [clubId, token]);


  return (
    <div style={{ padding: 24 }}>
      <h1>Club Events</h1>

      <button
        style={{ marginTop: 16 }}
        onClick={() =>
          router.push(`/admin/clubs/${clubId}/events/new`)
        }
      >
        + Create Event
      </button>

      {loading && <p>Loading events...</p>}

      {!loading && events.length === 0 && (
        <p style={{ marginTop: 20 }}>No events yet.</p>
      )}

      <ul style={{ marginTop: 20 }}>
        {events.map((event) => (
          <li key={event.id} style={{ marginBottom: 12 }}>
            <strong>{event.title}</strong>
            <br />
            <small>
              {new Date(event.event_date).toLocaleString()}
              {event.location ? ` @ ${event.location}` : ''}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
