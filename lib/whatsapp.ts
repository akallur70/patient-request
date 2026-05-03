import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppAlert({
  room,
  department,
  notes,
}: {
  room: string;
  department: string;
  notes: string | null;
}) {
  // Per-department numbers, falls back to global WHATSAPP_ALERT_NUMBERS
  const numbersEnv =
    process.env[`${department.toUpperCase()}_WHATSAPP_NUMBERS`] ||
    process.env.WHATSAPP_ALERT_NUMBERS ||
    '';

  const numbers = numbersEnv.split(',').map(n => n.trim()).filter(Boolean);

  const body = [
    `🔔 Patient Request`,
    `Room: ${room}`,
    `Department: ${department}`,
    notes ? `Note: ${notes}` : null,
    `Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
  ].filter(Boolean).join('\n');

  const promises = numbers.map(to =>
    client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body
    })
    .then(msg => console.log('WhatsApp sent:', msg.sid))
    .catch(err => console.error('WhatsApp error:', err.message))
  );

  await Promise.all(promises);
}
