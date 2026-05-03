'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Dept = 'Nursing' | 'Housekeeping' | 'Maintenance';

const DEPARTMENTS: { id: Dept; icon: string; label: string }[] = [
  { id: 'Nursing',      icon: '👩‍⚕️', label: 'Nursing' },
  { id: 'Housekeeping', icon: '🧹', label: 'Housekeeping' },
  { id: 'Maintenance',  icon: '🔧', label: 'Maintenance' },
];

function RequestForm() {
  const params   = useSearchParams();
  const hospital = params.get('hospital');
  const floor    = params.get('floor');
  const wing     = params.get('wing');
  const room     = params.get('room');

  const [dept, setDept]           = useState<Dept | null>(null);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  if (!hospital || !room) {
    return (
      <div className="error-page">
        Invalid QR code — hospital or room number missing.
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
      body: JSON.stringify({
        hospital,
        floor:      floor  || null,
        wing:       wing   || null,
        room,
        department: dept,
        notes:      notes.trim() || null,
      }),
    });
    setSubmitting(false);
    setDone(true);
  };

  const locationSub = [
    floor ? `Floor ${floor}` : null,
    wing  ? `Wing ${wing}`   : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="page">
      <div className="header">
        <div className="brand">
          <div className="brand-name">Saishree Vitalife</div>
          <div className="brand-sub">Hospital</div>
        </div>
        <div className="header-divider" />
        <div className="header-room">
          <div className="header-room-label">Room</div>
          <div className="header-room-number">{room}</div>
        </div>
      </div>

      {locationSub && (
        <div className="location-sub">{locationSub}</div>
      )}

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
