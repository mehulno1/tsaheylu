'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = 'http://127.0.0.1:8000';

type EventPass = {
  id: number;
  pass_code: string;
  event_title: string;
  event_date: string;
  user_phone: string;
  member: string;
};

export default function ClubPassesPage() {
  const params = useParams();
  const clubId = params.clubId as string;

  const [passes, setPasses] = useState<EventPass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPasses() {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          alert('Admin session expired. Please login again.');
          return;
        }

        const res = await fetch(
          `${API_BASE}/admin/clubs/${clubId}/passes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to load passes');
        }

        const data = await res.json();
        setPasses(data);
      } catch (err) {
        console.error(err);
        alert('Failed to load passes');
      } finally {
        setLoading(false);
      }
    }

    fetchPasses();
  }, [clubId]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading passes...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Event Passes
      </h1>

      {passes.length === 0 ? (
        <p style={{ color: '#666' }}>No passes issued yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 600,
                  }}
                >
                  Event Name
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 600,
                  }}
                >
                  Member
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 600,
                  }}
                >
                  Pass Code
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 600,
                  }}
                >
                  Phone
                </th>
              </tr>
            </thead>
            <tbody>
              {passes.map((pass) => (
                <tr
                  key={pass.id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <td style={{ padding: 12 }}>
                    {pass.event_title}
                    <br />
                    <small style={{ color: '#666' }}>
                      {new Date(pass.event_date).toLocaleDateString()}
                    </small>
                  </td>
                  <td style={{ padding: 12 }}>{pass.member}</td>
                  <td
                    style={{
                      padding: 12,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    {pass.pass_code}
                  </td>
                  <td style={{ padding: 12 }}>{pass.user_phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

