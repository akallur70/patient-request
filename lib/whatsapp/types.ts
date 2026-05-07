import { Location } from '../routing';

export interface SendParams {
  location: Location;
  room: string;
  department: string;
  notes: string | null;
  recipients: string[];
}

export type WhatsAppSender = (params: SendParams) => Promise<void>;
