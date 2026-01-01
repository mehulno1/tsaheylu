'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE } from '@/lib/apiConfig';

type Announcement = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

export default function ClubAnnouncementsPage() {
  const params = useParams();
  const clubId = params.clubId as string;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchAnnouncements() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(
      `${API_BASE}/clubs/${clubId}/announcements`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    setAnnouncements(data);
  }

  async function createAnnouncement() {
    const token = localStorage.getItem('admin_token');
    setLoading(true);

    await fetch(`${API_BASE}/clubs/${clubId}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        message,
      }),
    });

    setTitle('');
    setMessage('');
    setLoading(false);
    fetchAnnouncements();
  }

  useEffect(() => {
    fetchAnnouncements();
  }, [clubId]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Club Announcements
      </h1>

      {/* Create Announcement */}
      <div className="border p-4 rounded mb-8">
        <h2 className="font-semibold mb-3">
          Create New Announcement
        </h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded mb-3"
          rows={4}
        />

        <button
          onClick={createAnnouncement}
          disabled={!title || !message || loading}
          className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Publish
        </button>
      </div>

      {/* Announcements List */}
      <div>
        {announcements.length === 0 && (
          <p className="text-gray-500">
            No announcements yet.
          </p>
        )}

        {announcements.map((a) => (
          <div
            key={a.id}
            className="border p-4 rounded mb-4"
          >
            <h3 className="font-semibold">
              {a.title}
            </h3>
            <p className="text-gray-700 mt-1">
              {a.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(a.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

