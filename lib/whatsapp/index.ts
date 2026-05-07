import { SendParams, WhatsAppSender } from './types';
import { send as twilioSend } from './twilio';

const PROVIDERS: Record<string, WhatsAppSender> = {
  twilio: twilioSend,
};

export async function sendWhatsAppAlert(params: SendParams): Promise<void> {
  const providerName = process.env.WHATSAPP_PROVIDER || 'twilio';
  const provider = PROVIDERS[providerName];

  if (!provider) {
    console.error(`Unknown WhatsApp provider: ${providerName}`);
    return;
  }

  await provider(params);
}
