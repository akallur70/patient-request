'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const HOSPITALS = ['SVHW', 'SVHA', 'SVHB'];

interface QREntry {
  hospital: string;
  floor: string;
  wing: string;
  room: string;
  url: string;
  label: string;
}

function buildUrl(base: string, hospital: string, floor: string, wing: string, room: string) {
  const p = new URLSearchParams({ hospital, room });
  if (floor.trim()) p.set('floor', floor.trim());
  if (wing.trim())  p.set('wing',  wing.trim());
  return `${base}/request?${p.toString()}`;
}

function expandRooms(raw: string): string[] {
  return raw
    .split(',')
    .flatMap(part => {
      const range = part.trim().match(/^(\d+)-(\d+)$/);
      if (range) {
        const start = parseInt(range[1], 10);
        const end   = parseInt(range[2], 10);
        return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
      }
      return part.trim() ? [part.trim()] : [];
    });
}

export default function QRAdminPage() {
  const [hospital, setHospital] = useState(HOSPITALS[0]);
  const [floor,    setFloor]    = useState('');
  const [wing,     setWing]     = useState('');
  const [rooms,    setRooms]    = useState('');
  const [baseUrl,  setBaseUrl]  = useState(
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [entries, setEntries]   = useState<QREntry[]>([]);

  const generate = () => {
    const roomList = expandRooms(rooms);
    const next = roomList.map(room => ({
      hospital,
      floor: floor.trim(),
      wing:  wing.trim(),
      room,
      url:   buildUrl(baseUrl, hospital, floor.trim(), wing.trim(), room),
      label: [hospital, floor ? `F${floor}` : null, wing ? `W${wing}` : null, `Rm ${room}`]
               .filter(Boolean).join(' · '),
    }));
    setEntries(next);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 960, margin: 'auto', padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a73e8', marginBottom: 4 }}>
        Saishree Vitalife — QR Code Generator
      </h1>
      <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>
        Fill in the location details and room range, then click Generate.
      </p>

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <label style={labelStyle}>
          Hospital
          <select value={hospital} onChange={e => setHospital(e.target.value)} style={inputStyle}>
            {HOSPITALS.map(h => <option key={h}>{h}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          Floor
          <input style={inputStyle} placeholder="e.g. 1" value={floor} onChange={e => setFloor(e.target.value)} />
        </label>

        <label style={labelStyle}>
          Wing <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
          <input style={inputStyle} placeholder="e.g. A or B" value={wing} onChange={e => setWing(e.target.value)} />
        </label>

        <label style={labelStyle}>
          Rooms
          <input
            style={inputStyle}
            placeholder="101-110, 201, 205"
            value={rooms}
            onChange={e => setRooms(e.target.value)}
          />
        </label>

        <label style={labelStyle}>
          Base URL
          <input style={inputStyle} value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button onClick={generate} style={btnStyle}>
          Generate QR Codes
        </button>
        {entries.length > 0 && (
          <button onClick={() => window.print()} style={{ ...btnStyle, background: '#34a853' }}>
            Print / Save PDF
          </button>
        )}
        {entries.length > 0 && (
          <button onClick={() => setEntries([])} style={{ ...btnStyle, background: '#ea4335' }}>
            Clear
          </button>
        )}
      </div>

      {/* QR Grid */}
      {entries.length > 0 && (
        <>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>
            {entries.length} QR code{entries.length !== 1 ? 's' : ''} generated
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
            {entries.map(e => (
              <div
                key={e.room}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  breakInside: 'avoid',
                }}
              >
                <QRCodeSVG value={e.url} size={160} />
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1a73e8' }}>Room {e.room}</div>
                <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>{e.label}</div>
                <div style={{ fontSize: 10, color: '#bbb', wordBreak: 'break-all', textAlign: 'center' }}>{e.url}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        @media print {
          button { display: none !important; }
          h1, p { display: none; }
          label { display: none; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: '#333',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.5px solid #ddd',
  fontSize: 14,
  fontFamily: 'Arial, sans-serif',
};

const btnStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 10,
  border: 'none',
  background: '#1a73e8',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};
