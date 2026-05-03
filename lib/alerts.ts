import { sendAlertEmail } from './mailer';
import { sendWhatsAppAlert } from './whatsapp';

export interface AlertPayload {
  room: string;
  department: 'Nursing' | 'Housekeeping' | 'Maintenance';
  notes: string | null;
}

export async function sendAlerts(payload: AlertPayload) {
  const emailEnabled = process.env.ALERT_EMAIL_ENABLED === 'true';
  const whatsappEnabled = process.env.ALERT_WHATSAPP_ENABLED === 'true';

  const tasks: Promise<void>[] = [];

  if (emailEnabled) {
    tasks.push(
      sendAlertEmail(payload).catch(err =>
        console.error('Email alert failed:', err.message)
      )
    );
  }

  if (whatsappEnabled) {
    tasks.push(
      sendWhatsAppAlert(payload).catch(err =>
        console.error('WhatsApp alert failed:', err.message)
      )
    );
  }

  await Promise.all(tasks);
}
