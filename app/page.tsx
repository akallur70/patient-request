'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

type Dept = 'Nursing' | 'Housekeeping' | 'Maintenance';

const DEPARTMENTS: { id: Dept; icon: string; label: string }[] = [
  { id: 'Nursing',      icon: '👩‍⚕️', label: 'Nursing' },
  { id: 'Housekeeping', icon: '🧹', label: 'Housekeeping' },
  { id: 'Maintenance',  icon: '🔧', label: 'Maintenance' },
];

function RequestForm() {
  const params = useSearchParams();
  const room = params.get('room');

  const [dept, setDept] = useState<Dept | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!room) {
    return (
      <div className="error-page">
        Invalid QR code — no room number found.
      </div>
    );
  }

  if (done) {
    return (
      <div className="thankyou">
        <div className="icon">✅</div>
        <div className="msg">Request Sent!</div>
        <div className="sub">Staff have been notified. We will attend to you shortly.</div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!dept) return;
    setSubmitting(true);
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, department: dept, notes: notes.trim() || null }),
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="page">
      <div className="header">
        <Image src="/logo.svg" alt="Sai Shree Vita Life" width={200} height={60} style={{ objectFit: 'contain' }} />
      </div>

      <div className="room-badge">
        <div className="label">Room</div>
        <div className="number">{room}</div>
      </div>

      <div className="section-title">What do you need help with?</div>

      <div className="dept-grid">
        {DEPARTMENTS.map(d => (
          <div
            key={d.id}
            className={`dept-btn${dept === d.id ? ` selected-${d.id}` : ''}`}
            onClick={() => setDept(d.id)}
          >
            <span className="icon">{d.icon}</span>
            <span className="text">{d.label}</span>
          </div>
        ))}
      </div>

      <textarea
        maxLength={200}
        placeholder="Additional details (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <div className="char-count">{notes.length} / 200</div>

      <button
        className="submit-btn"
        disabled={!dept || submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'Sending...' : 'Submit Request'}
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <RequestForm />
    </Suspense>
  );
}
