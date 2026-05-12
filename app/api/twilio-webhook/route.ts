import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { getRequestStatus, updateRequestStatus } from '../../../lib/statusTracking';
import { sendWhatsAppAlert } from '../../../lib/whatsapp';

function normalizeFormData(entries: Iterable<[FormDataEntryValue, FormDataEntryValue]>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of entries) {
    normalized[key.toString().toLowerCase()] = value.toString();
  }
  return normalized;
}

function parseAction(input: string): { action: 'acknowledged' | 'resolved'; requestId: string } | null {
  const trimmed = input?.trim();
  const match = trimmed.match(/^(ack|done)\s*[:\-\s]+([0-9a-fA-F\-]+)$/i);
  if (match) {
    const shortAction = match[1].toLowerCase();
    const requestId = match[2];
    const action = shortAction === 'ack' ? 'acknowledged' : 'resolved';
    return { action, requestId };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let values: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      values = normalizeFormData(formData.entries());
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      values = Object.fromEntries(Object.entries(json).map(([key, value]) => [key.toLowerCase(), String(value)]));
    }

    const from = values['from'] || values['waid'] || values['whatsappid'];
    const body = values['body'] || '';
    const buttonPayload = values['buttonpayload'] || values['buttonresponsepayload'] || values['button_payload'] || values['interactivebuttonreplypayload'] || '';

    const parsed = parseAction(buttonPayload || body);
    if (!parsed) {
      console.log('Twilio webhook ignored unsupported body:', { body, buttonPayload });
      return NextResponse.json({ success: false, message: 'Unsupported action format' });
    }

    const { action, requestId } = parsed;
    const currentStatus = await getRequestStatus(requestId);
    if (!currentStatus) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const statusFrom = currentStatus.status;
    const statusTo = action;
    const updated = await updateRequestStatus({
      requestId,
      statusFrom,
      statusTo,
      actionBy: from,
      actionType: action,
      notes: `WhatsApp button response: ${action}`,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 });
    }

    const { data: patientRequest, error: requestError } = await supabase
      .from('patient_requests')
      .select('hospital, floor, wing, room, department')
      .eq('id', requestId)
      .single();

    if (requestError || !patientRequest) {
      console.error('Failed to load request details for webhook confirmation', requestError?.message);
    } else {
      await sendWhatsAppAlert({
        recipients: [from],
        location: {
          hospital: patientRequest.hospital,
          floor: patientRequest.floor,
          wing: patientRequest.wing,
        },
        room: patientRequest.room,
        department: patientRequest.department as any,
        notes: action === 'acknowledged'
          ? '✅ Request acknowledged. Please proceed.'
          : '✅ Request marked done. Thank you!',
      });
    }

    return NextResponse.json({ success: true, action, requestId });
  } catch (err: any) {
    console.error('Twilio webhook error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
