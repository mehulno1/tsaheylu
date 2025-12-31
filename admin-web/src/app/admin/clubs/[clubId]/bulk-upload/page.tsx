'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_BASE = 'http://127.0.0.1:8000';

type UploadResult = {
  success: boolean;
  summary: {
    total_rows: number;
    created: number;
    skipped: number;
    errors: number;
  };
  created: Array<{
    row: number;
    phone: string;
    member: string;
    membership_id: number;
  }>;
  skipped: Array<{
    row: number;
    phone: string;
    member: string;
    membership_id: number;
    reason: string;
  }>;
  errors: Array<{
    row: number;
    phone: string;
    error: string;
  }>;
};

export default function BulkUploadPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${API_BASE}/admin/clubs/${clubId}/bulk-upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data: UploadResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Bulk Upload Members
      </h1>

      <div
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 10,
          border: '1px solid #e5e5e5',
          maxWidth: 800,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Upload CSV File
        </h2>

        <p style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
          CSV format: <code>phone,name,relation,membership_expiry</code>
        </p>
        <p style={{ marginBottom: 24, color: '#666', fontSize: 14 }}>
          Required: phone (10 digits). Optional: name (for self: updates if null; for dependent: required with relation), relation (for dependents), membership_expiry (YYYY-MM-DD).
        </p>

        <div style={{ marginBottom: 20 }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
            style={{
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 4,
              width: '100%',
            }}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            padding: '10px 20px',
            background: uploading || !file ? '#ccc' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: uploading || !file ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: 4,
              color: '#c00',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Upload Summary
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#000' }}>
                  {result.summary.total_rows}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Total Rows</div>
              </div>
              <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2e7d32' }}>
                  {result.summary.created}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Created</div>
              </div>
              <div style={{ padding: 12, background: '#fff3e0', borderRadius: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#e65100' }}>
                  {result.summary.skipped}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Skipped</div>
              </div>
              <div style={{ padding: 12, background: '#ffebee', borderRadius: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#c62828' }}>
                  {result.summary.errors}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Errors</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Errors ({result.errors.length}):
                </h4>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    padding: 12,
                  }}
                >
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 8,
                        marginBottom: 4,
                        background: '#ffebee',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      <strong>Row {err.row}</strong> ({err.phone}): {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.skipped.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Skipped ({result.skipped.length}):
                </h4>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    padding: 12,
                    fontSize: 12,
                  }}
                >
                  {result.skipped.map((skip, idx) => (
                    <div key={idx} style={{ padding: 4 }}>
                      Row {skip.row}: {skip.phone} ({skip.member}) - {skip.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.created.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Created ({result.created.length}):
                </h4>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    padding: 12,
                    fontSize: 12,
                  }}
                >
                  {result.created.map((create, idx) => (
                    <div key={idx} style={{ padding: 4 }}>
                      Row {create.row}: {create.phone} ({create.member}) - Membership ID: {create.membership_id}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => router.push(`/admin/clubs/${clubId}/pending-members`)}
                style={{
                  padding: '10px 20px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                View Pending Members
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

