'use client';

import { useEffect, useState } from 'react';

const HOSPITALS   = ['SVHW', 'SVHA', 'SVHB'];
const DEPARTMENTS = ['Nursing', 'Housekeeping', 'Maintenance'];
const TYPES       = ['email', 'whatsapp'];

const HOSPITAL_NAMES: Record<string, string> = {
  SVHW: 'Wakad',
  SVHA: 'Aundh',
  SVHB: 'Borse',
};

interface Contact {
  id: string;
  hospital: string;
  floor: string | null;
  wing: string | null;
  department: string;
  type: string;
  contact: string;
  active: boolean;
}

const empty = { hospital: 'SVHW', floor: '', wing: '', department: 'Nursing', type: 'email', contact: '' };

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/contacts');
    const data = await res.json();
    setContacts(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.contact.trim()) { setError('Contact is required'); return; }
    setError('');
    setSaving(true);
    const res = await fetch('/api/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setForm(empty); load(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleToggle = async (c: Contact) => {
    await fetch(`/api/admin/contacts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
    load();
  };

  const grouped = HOSPITALS.flatMap(h =>
    DEPARTMENTS.flatMap(d =>
      contacts.filter(c => c.hospital === h && c.department === d)
    )
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 960, margin: 'auto', padding: 32 }}>

      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a73e8', marginBottom: 4 }}>
        Saishree Vitalife — Routing Contacts
      </h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>
        Manage who receives alerts for each hospital and department.
      </p>

      {/* Add form */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: '#333' }}>Add Contact</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
          <label style={labelStyle}>
            Hospital
            <select style={inputStyle} value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))}>
              {HOSPITALS.map(h => <option key={h} value={h}>{h} — {HOSPITAL_NAMES[h]}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Floor <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
            <input style={inputStyle} placeholder="e.g. 2" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
          </label>

          <label style={labelStyle}>
            Wing <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
            <input style={inputStyle} placeholder="e.g. A" value={form.wing} onChange={e => setForm(f => ({ ...f, wing: e.target.value }))} />
          </label>

          <label style={labelStyle}>
            Department
            <select style={inputStyle} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Type
            <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Contact
            <input
              style={inputStyle}
              placeholder={form.type === 'whatsapp' ? 'whatsapp:+919...' : 'name@email.com'}
              value={form.contact}
              onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
            />
          </label>
        </div>

        {form.type === 'whatsapp' && (
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            WhatsApp format: <code>whatsapp:+919XXXXXXXXX</code>
          </div>
        )}

        {error && <div style={{ color: '#ea4335', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button onClick={handleAdd} disabled={saving} style={btnStyle}>
          {saving ? 'Adding...' : '+ Add Contact'}
        </button>
      </div>

      {/* Contacts table */}
      {contacts.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>No contacts yet. Add one above.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Hospital', 'Floor', 'Wing', 'Department', 'Type', 'Contact', 'Active', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 700 }}>{c.hospital}</span>
                  <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>{HOSPITAL_NAMES[c.hospital]}</span>
                </td>
                <td style={tdStyle}>{c.floor || <span style={{ color: '#ccc' }}>—</span>}</td>
                <td style={tdStyle}>{c.wing  || <span style={{ color: '#ccc' }}>—</span>}</td>
                <td style={tdStyle}>{c.department}</td>
                <td style={tdStyle}>
                  <span style={{
                    background: c.type === 'email' ? '#e8f0fe' : '#e8f5e9',
                    color:      c.type === 'email' ? '#1a73e8' : '#34a853',
                    padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  }}>
                    {c.type}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 13 }}>{c.contact}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleToggle(c)}
                    style={{
                      background: c.active ? '#e8f5e9' : '#fce8e6',
                      color:      c.active ? '#34a853' : '#ea4335',
                      border: 'none', borderRadius: 8, padding: '4px 10px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 700, color: '#333' };
const inputStyle: React.CSSProperties = { padding: '9px 11px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14, fontFamily: 'Arial, sans-serif' };
const btnStyle:   React.CSSProperties = { padding: '10px 22px', borderRadius: 10, border: 'none', background: '#1a73e8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const thStyle:    React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 13, color: '#555', fontWeight: 700 };
const tdStyle:    React.CSSProperties = { padding: '10px 14px', fontSize: 14, color: '#333', borderTop: '1px solid #f0f0f0' };
