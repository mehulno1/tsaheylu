'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CreateEventPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) {
      alert('Admin session expired. Please login again.');
      router.push('/login');
      return;  
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    async function createEvent() {
      if (!title || !eventDate) {
        alert('Title and date are required');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/admin/clubs/${clubId}/events`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title,
              description: description || null,
              event_date: eventDate,
              location: location || null,
              requires_pass: requiresPass,
            }),
          }
        );

        if (!res.ok) throw new Error();

        router.push(`/admin/clubs/${clubId}/events`);
      } catch {
        alert('Failed to create event');
      } finally {
        setLoading(false);
      }
    }

    createEvent();
  }, [clubId, token]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [requiresPass, setRequiresPass] = useState(true);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title || !eventDate) {
      alert('Title and date are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/admin/clubs/${clubId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
          },
          body: JSON.stringify({
            title,
            description: description || null,
            event_date: eventDate,
            location: location || null,
            requires_pass: requiresPass,
          }),
        }
      );

      if (!res.ok) throw new Error();

      router.push(`/admin/clubs/${clubId}/events`);
    } catch {
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h1>Create Event</h1>

      <input
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br /><br />

      <input
        type="datetime-local"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <br /><br />

      <label>
        <input
          type="checkbox"
          checked={requiresPass}
          onChange={(e) => setRequiresPass(e.target.checked)}
        />
        Requires Pass
      </label>

      <br /><br />

      <button onClick={submit} disabled={loading}>
        {loading ? 'Creating...' : 'Create Event'}
      </button>
    </div>
  );
}
