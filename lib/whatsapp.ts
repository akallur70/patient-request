import twilio from 'twilio';
import { Location } from './routing';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppAlert({
  location,
  room,
  department,
  notes,
  recipients,
}: {
  location: Location;
  room: string;
  department: string;
  notes: string | null;
  recipients: string[];
}) {
  const locationLine = [
    location.hospital,
    location.floor ? `Floor ${location.floor}` : null,
    location.wing  ? `Wing ${location.wing}`   : null,
  ].filter(Boolean).join(' · ');

  const body = [
    `🔔 Patient Request`,
    `Location: ${locationLine}`,
    `Room: ${room}`,
    `Department: ${department}`,
    notes ? `Note: ${notes}` : null,
    `Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
  ].filter(Boolean).join('\n');

  const promises = recipients.map(to =>
    client.messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to, body })
      .then(msg => console.log('WhatsApp sent:', msg.sid))
      .catch(err => console.error('WhatsApp error:', err.message))
  );

  await Promise.all(promises);
}
