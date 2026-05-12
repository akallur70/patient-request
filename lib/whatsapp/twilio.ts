import twilio from 'twilio';
import { SendParams } from './types';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function send({ location, room, department, notes, recipients, requestId, includeButtons }: SendParams): Promise<void> {
  const locationLine = [
    location.hospital,
    location.floor ? `Floor ${location.floor}` : null,
    location.wing  ? `Wing ${location.wing}`   : null,
  ].filter(Boolean).join(' · ');

  const messageText = [
    `🔔 Patient Request`,
    `Location: ${locationLine}`,
    `Room: ${room}`,
    `Department: ${department}`,
    notes ? `Note: ${notes}` : null,
    `Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
  ].filter(Boolean).join('\n');

  const promises = recipients.map(to => {
    const base = { from: process.env.TWILIO_WHATSAPP_FROM as string, to };

    const params = (includeButtons && requestId && process.env.TWILIO_CONTENT_SID)
      ? { ...base, contentSid: process.env.TWILIO_CONTENT_SID, contentVariables: JSON.stringify({ '1': messageText, '2': String(requestId) }) }
      : { ...base, body: messageText };

    return client.messages.create(params)
      .then(msg => console.log('WhatsApp sent:', msg.sid, { to, requestId }))
      .catch(err => console.error('WhatsApp error:', err.message, { to, requestId }));
  });

  await Promise.all(promises);
}

