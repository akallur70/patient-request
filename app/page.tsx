'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Dept = 'Nursing' | 'Housekeeping' | 'Maintenance';

const HOSPITAL_NAMES: Record<string, string> = {
  SVHW: 'Wakad',
  SVHA: 'Aundh',
  SVHB: 'Borse',
};

const DEPARTMENTS: { id: Dept; icon: string; label: string; sub: string; labelMr: string; subMr: string }[] = [
  { id: 'Nursing',      icon: '👩‍⚕️', label: 'Nursing',      sub: 'Medicine, Vitals, Checkup etc.',  labelMr: 'नर्सिंग',       subMr: 'औषध, नाडी-ताप, तपासणी इ.' },
  { id: 'Housekeeping', icon: '🧹',   label: 'Room Hygiene', sub: 'Linen, Cleaning & Toilet etc.',   labelMr: 'खोली स्वच्छता', subMr: 'चादर, साफसफाई आणि शौचालय इ.' },
  { id: 'Maintenance',  icon: '🔧',   label: 'Room Comfort', sub: 'TV, AC, Fan & Bed Remote etc.',   labelMr: 'खोली सुविधा',   subMr: 'टीव्ही, एसी, पंखा आणि बेड रिमोट इ.' },
];

function RequestForm() {
  const params   = useSearchParams();
  const hospital = params.get('hospital');
  const floor    = params.get('floor');
  const wing     = params.get('wing');
  const room     = params.get('room');

  const [dept, setDept]             = useState<Dept | null>(null);
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

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
        <img src="/logo.svg" alt="Saishree Vitalife" className="header-logo" />
        <div className="header-info">
          <div className="header-location">{HOSPITAL_NAMES[hospital] ?? hospital}</div>
          <div className="header-room">
            <div className="header-room-label">Room</div>
            <div className="header-room-number">{room}</div>
          </div>
        </div>
      </div>

      {locationSub && (
        <div className="location-sub">{locationSub}</div>
      )}

      <div className="section-title">
        What do you need help with?
        <div className="section-title-mr">आपल्याला कशाची मदत हवी आहे?</div>
      </div>

      <div className="dept-grid">
        {DEPARTMENTS.map(d => (
          <div
            key={d.id}
            className={`dept-btn${dept === d.id ? ` selected-${d.id}` : ''}`}
            onClick={() => setDept(d.id)}
          >
            <span className="dept-icon">{d.icon}</span>
            <div className="dept-text">
              <div className="dept-label">{d.label}</div>
              <div className="dept-sub">{d.sub}</div>
              <div className="dept-label-mr">{d.labelMr}</div>
              <div className="dept-sub-mr">{d.subMr}</div>
            </div>
          </div>
        ))}
      </div>

      <textarea
        maxLength={200}
        placeholder="Additional details (optional) / अतिरिक्त माहिती (पर्यायी)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <div className="char-count">{notes.length} / 200</div>

      <button
        className="submit-btn"
        disabled={!dept || submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'Sending...' : (
          <>
            <span>Submit Request</span>
            <span className="submit-btn-mr">विनंती सादर करा</span>
          </>
        )}
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
