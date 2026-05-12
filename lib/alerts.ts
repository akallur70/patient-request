import { sendAlertEmail } from './mailer';
import { sendWhatsAppAlert } from './whatsapp';
import { getContacts, Location } from './routing';

export interface AlertPayload {
  location: Location;
  room: string;
  department: string;
  notes: string | null;
  requestId?: string;
}

export async function sendAlerts(payload: AlertPayload) {
  const emailEnabled    = process.env.ALERT_EMAIL_ENABLED    === 'true';
  const whatsappEnabled = process.env.ALERT_WHATSAPP_ENABLED === 'true';

  if (!emailEnabled && !whatsappEnabled) return;

  const { emails, whatsapp } = await getContacts(payload.location, payload.department);
  console.log('getContacts result:', JSON.stringify({ emails, whatsapp }));

  const tasks: Promise<void>[] = [];

  if (emailEnabled && emails.length > 0) {
    tasks.push(
      sendAlertEmail({ ...payload, recipients: emails }).catch(err =>
        console.error('Email alert failed:', err.message)
      )
    );
  }

  if (whatsappEnabled && whatsapp.length > 0) {
    tasks.push(
      sendWhatsAppAlert({
        ...payload,
        recipients: whatsapp,
        requestId: payload.requestId,
        includeButtons: Boolean(payload.requestId),
      }).catch(err =>
        console.error('WhatsApp alert failed:', err.message)
      )
    );
  }

  await Promise.all(tasks);
}
